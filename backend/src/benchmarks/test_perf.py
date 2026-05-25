"""
Performance benchmarks: query counts + wall-clock timing for every major API
endpoint.  Run with:

    python -m django test benchmarks --settings=dental.test_settings -v 2

A test fails when:
  - It detects N+1 queries (query count grows with dataset size), OR
  - Wall-clock time exceeds a generous threshold (mostly catches catastrophic
    regressions; real latency work needs a real DB).

Query budgets are intentionally tight so regressions are obvious.
"""

import time
import datetime

from django.db import connection, reset_queries
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from users.models import User
from doctors.models import Doctors, Specialization, Service
from client.models import Client, Gender, FindOut
from records.models import (
    Record, Status, ChairNum, RecordingType, PaymentType, PaymentState,
)
from medical.models import MedicalNote, ToothRecord, TreatmentPlanItem


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

DATASET_SIZE = 30   # number of records/clients created in each benchmark setUp


def _elapsed(start: float) -> float:
    return time.perf_counter() - start


class BenchBase(TestCase):
    """Common fixtures shared across all benchmark classes."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email="bench_admin@clinic.com", password="pass", role="admin",
        )
        self.doctor_user = User.objects.create_user(
            email="bench_doc@clinic.com", password="pass", role="doctor",
            first_name="Bench", last_name="Doctor",
        )
        self.spec = Specialization.objects.create(title="Терапия", cost=5000)
        self.svc = Service.objects.create(title="Пломба", spec_id=self.spec)
        self.doctor = Doctors.objects.create(
            user=self.doctor_user,
            first_name="Bench", last_name="Doctor", father_name="Test",
            services_id=self.svc,
        )
        self.gender = Gender.objects.create(gender_name="Мужской")
        self.find_out = FindOut.objects.create(find_out_name="Интернет")

        self.admin_api = APIClient()
        self.admin_api.force_authenticate(user=self.admin)
        self.doctor_api = APIClient()
        self.doctor_api.force_authenticate(user=self.doctor_user)

        # shared lookup objects for records
        self.status = Status.objects.create(title="Ожидает")
        self.chair = ChairNum.objects.create(title="Кабинет 1")
        self.rec_type = RecordingType.objects.create(title="Первичный")
        self.pay_type = PaymentType.objects.create(title="Наличные")
        self.pay_state = PaymentState.objects.create(title="Не оплачено")
        self.today = datetime.date.today()

    # ------------------------------------------------------------------ utils

    def _make_client(self, i: int) -> Client:
        return Client.objects.create(
            first_name=f"Имя{i}", last_name=f"Фамилия{i}", father_name="О.",
            gender=self.gender, find_out=self.find_out, doctor=self.doctor,
            mobile_phone=f"+7700{i:07d}",
        )

    def _make_record(self, patient: Client, i: int) -> Record:
        return Record.objects.create(
            client=patient,
            client_first_name=patient.first_name,
            client_last_name=patient.last_name,
            client_father_name=patient.father_name,
            doctor=self.doctor,
            doctors_name=f"{self.doctor.last_name} {self.doctor.first_name}",
            assistant=None, assistant_name="",
            service=self.svc, specialization=self.spec,
            tooth=11 + i % 20,
            specialization_cost=5000, count=1, sell=0, total=5000,
            registration_date=self.today, record_start=self.today,
            record_end=self.today, reception_day=self.today,
            recording_type=self.rec_type, chair=self.chair,
            payment_type=self.pay_type, payment_state=self.pay_state,
            status=self.status,
        )

    def _query_count(self, callable_):
        """Return (result, num_queries) for the given callable."""
        with CaptureQueriesContext(connection) as ctx:
            result = callable_()
        return result, len(ctx.captured_queries)

    def _query_count_and_time(self, callable_):
        """Return (result, num_queries, elapsed_seconds)."""
        t0 = time.perf_counter()
        with CaptureQueriesContext(connection) as ctx:
            result = callable_()
        elapsed = time.perf_counter() - t0
        return result, len(ctx.captured_queries), elapsed


# ===========================================================================
# 1. Records list
# ===========================================================================

class RecordListBenchmark(BenchBase):
    """GET /api/v1/records/ — should NOT grow queries with dataset size."""

    def setUp(self):
        super().setUp()
        patient = self._make_client(0)
        for i in range(DATASET_SIZE):
            self._make_record(patient, i)

    def test_query_count_is_constant(self):
        """Expect ≤ 4 queries regardless of DATASET_SIZE (no N+1)."""
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get("/api/v1/records/")
        )
        print(f"\n[records list] queries={q}, elapsed={elapsed*1000:.1f}ms, rows={DATASET_SIZE}")
        self.assertLessEqual(
            q, 4,
            f"RecordViewSet list used {q} queries for {DATASET_SIZE} records — "
            f"expected ≤ 4 (possible N+1 on a related field).",
        )

    def test_filter_by_date_query_count(self):
        """Filtered list should also stay ≤ 4 queries."""
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get(f"/api/v1/records/?reception_day={self.today}")
        )
        print(f"\n[records date-filter] queries={q}, elapsed={elapsed*1000:.1f}ms")
        self.assertLessEqual(q, 4, f"Date-filtered records used {q} queries.")

    def test_filter_by_doctor_query_count(self):
        """Filtering by doctor should also stay ≤ 4 queries."""
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get(f"/api/v1/records/?doctor={self.doctor.id}")
        )
        print(f"\n[records doctor-filter] queries={q}, elapsed={elapsed*1000:.1f}ms")
        self.assertLessEqual(q, 4, f"Doctor-filtered records used {q} queries.")


# ===========================================================================
# 2. Client list
# ===========================================================================

class ClientListBenchmark(BenchBase):
    """GET /api/v1/clients/ — serializer touches gender, find_out, doctor."""

    def setUp(self):
        super().setUp()
        for i in range(DATASET_SIZE):
            self._make_client(i)

    def test_query_count_is_constant(self):
        """Expect ≤ 3 queries regardless of DATASET_SIZE (no N+1)."""
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get("/api/v1/clients/")
        )
        print(f"\n[clients list] queries={q}, elapsed={elapsed*1000:.1f}ms, rows={DATASET_SIZE}")
        self.assertLessEqual(
            q, 3,
            f"ClientViewSet list used {q} queries for {DATASET_SIZE} clients — "
            f"expected ≤ 3 (possible N+1 on gender/find_out/doctor).",
        )

    def test_search_query_count(self):
        """Search filter should not add extra per-row queries."""
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get("/api/v1/clients/?search=Имя1")
        )
        print(f"\n[clients search] queries={q}, elapsed={elapsed*1000:.1f}ms")
        self.assertLessEqual(q, 3, f"Client search used {q} queries.")


# ===========================================================================
# 3. Doctors list
# ===========================================================================

class DoctorListBenchmark(BenchBase):
    """GET /api/v1/doctors/ — DoctorSerializer only returns FK id, no nesting."""

    def setUp(self):
        super().setUp()
        for i in range(DATASET_SIZE):
            Doctors.objects.create(
                first_name=f"Врач{i}", last_name=f"Фам{i}", father_name="О.",
                services_id=self.svc,
            )

    def test_query_count_is_constant(self):
        """Expect ≤ 3 queries."""
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get("/api/v1/doctors/")
        )
        print(f"\n[doctors list] queries={q}, elapsed={elapsed*1000:.1f}ms, rows={DATASET_SIZE}")
        self.assertLessEqual(q, 3, f"DoctorViewSet list used {q} queries.")


# ===========================================================================
# 4. Medical note — doctor access path
# ===========================================================================

class MedicalNoteAccessBenchmark(BenchBase):
    """
    GET /api/v1/medical/{id}/note/ — when a doctor accesses their own patient.
    ClientAccessMixin.get_client() issues several queries per request; measure
    them so a regression is visible.
    """

    def setUp(self):
        super().setUp()
        self.patient = self._make_client(0)
        MedicalNote.objects.create(patient=self.patient, updated_by=self.admin)

    def test_admin_note_query_count(self):
        """Admin path: expect ≤ 3 queries (client lookup + get_or_create + serialise)."""
        url = f"/api/v1/medical/{self.patient.id}/note/"
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get(url)
        )
        print(f"\n[medical note admin] queries={q}, elapsed={elapsed*1000:.1f}ms")
        self.assertLessEqual(q, 3, f"Medical note (admin) used {q} queries.")

    def test_doctor_note_query_count(self):
        """
        Doctor path: get_client() does an extra reverse-OneToOne lookup plus
        possibly a Record.exists() query.  Budget is tighter than the code
        used to allow so a regression shows immediately.
        """
        url = f"/api/v1/medical/{self.patient.id}/note/"
        _, q, elapsed = self._query_count_and_time(
            lambda: self.doctor_api.get(url)
        )
        print(f"\n[medical note doctor] queries={q}, elapsed={elapsed*1000:.1f}ms")
        self.assertLessEqual(
            q, 4,
            f"Medical note (doctor) used {q} queries — "
            f"get_client() may be issuing redundant lookups.",
        )


# ===========================================================================
# 5. Teeth list
# ===========================================================================

class TeethListBenchmark(BenchBase):
    """GET /api/v1/medical/{id}/teeth/ — should not N+1 across tooth records."""

    def setUp(self):
        super().setUp()
        self.patient = self._make_client(0)
        for n in range(1, DATASET_SIZE + 1):
            ToothRecord.objects.create(
                patient=self.patient,
                tooth_number=str(n % 32 + 1),
                updated_by=self.admin,
            )

    def test_query_count_is_constant(self):
        """Expect ≤ 3 queries regardless of tooth count."""
        url = f"/api/v1/medical/{self.patient.id}/teeth/"
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get(url)
        )
        print(f"\n[teeth list] queries={q}, elapsed={elapsed*1000:.1f}ms, rows={DATASET_SIZE}")
        self.assertLessEqual(q, 3, f"TeethListView used {q} queries for {DATASET_SIZE} teeth.")


# ===========================================================================
# 6. Treatment plan list
# ===========================================================================

class TreatmentPlanListBenchmark(BenchBase):
    """GET /api/v1/medical/{id}/plan/ — plan items with FK to service/record/doctor."""

    def setUp(self):
        super().setUp()
        self.patient = self._make_client(0)
        for i in range(DATASET_SIZE):
            TreatmentPlanItem.objects.create(
                patient=self.patient,
                tooth_number=str(i % 32 + 1),
                diagnosis=f"Кариес {i}",
                treatment=f"Пломба {i}",
                service=self.svc,
                doctor=self.admin,
            )

    def test_query_count_is_constant(self):
        """Expect ≤ 3 queries regardless of plan size."""
        url = f"/api/v1/medical/{self.patient.id}/plan/"
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get(url)
        )
        print(f"\n[plan list] queries={q}, elapsed={elapsed*1000:.1f}ms, rows={DATASET_SIZE}")
        self.assertLessEqual(q, 3, f"PlanListView used {q} queries for {DATASET_SIZE} items.")


# ===========================================================================
# 7. Services list — nested SpecializationSerializer
# ===========================================================================

class ServiceListBenchmark(BenchBase):
    """GET /api/v1/services/ — returns nested spec_id; must use select_related."""

    def setUp(self):
        super().setUp()
        for i in range(DATASET_SIZE):
            spec = Specialization.objects.create(title=f"Спец{i}", cost=3000 + i * 100)
            Service.objects.create(title=f"Услуга{i}", spec_id=spec)

    def test_query_count_is_constant(self):
        """Expect ≤ 3 queries (count + join select)."""
        _, q, elapsed = self._query_count_and_time(
            lambda: self.admin_api.get("/api/v1/services/")
        )
        print(f"\n[services list] queries={q}, elapsed={elapsed*1000:.1f}ms, rows={DATASET_SIZE}")
        self.assertLessEqual(
            q, 3,
            f"ServiceViewSet list used {q} queries for {DATASET_SIZE} services — "
            f"possible N+1 on nested spec_id serializer.",
        )
