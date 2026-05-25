"""
Deep profiling: captures exact SQL for each endpoint and reports:
 - number of queries
 - cumulative query time (SQLite approximation)
 - duplicate queries (sign of missing caching or select_related)

Run with:
    python -m django test benchmarks.test_profile --settings=dental.test_settings -v 2
"""

import datetime
import time
from collections import Counter

from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from users.models import User
from doctors.models import Doctors, Specialization, Service
from client.models import Client, Gender, FindOut
from records.models import (
    Record, Status, ChairNum, RecordingType, PaymentType, PaymentState,
)
from medical.models import MedicalNote, ToothRecord, TreatmentPlanItem


DATASET_SIZE = 50


def _profile(api_client, method, url):
    """
    Make one request, return a dict with:
      queries:   list of SQL strings
      count:     number of queries
      dupes:     list of (sql, count) for any query that ran more than once
      elapsed_ms: wall-clock time in milliseconds
    """
    t0 = time.perf_counter()
    with CaptureQueriesContext(connection) as ctx:
        response = getattr(api_client, method)(url)
    elapsed = (time.perf_counter() - t0) * 1000

    sqls = [q["sql"] for q in ctx.captured_queries]
    counter = Counter(sqls)
    dupes = [(sql, cnt) for sql, cnt in counter.items() if cnt > 1]

    return {
        "status": response.status_code,
        "queries": sqls,
        "count": len(sqls),
        "dupes": dupes,
        "elapsed_ms": elapsed,
    }


def _print_report(label, report):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  HTTP {report['status']} | queries={report['count']} | {report['elapsed_ms']:.1f}ms")
    if report["dupes"]:
        print(f"  *** DUPLICATE QUERIES ({len(report['dupes'])} unique dupes) ***")
        for sql, cnt in report["dupes"]:
            short = sql[:120].replace("\n", " ")
            print(f"    x{cnt}: {short}...")
    for i, sql in enumerate(report["queries"], 1):
        short = sql[:120].replace("\n", " ")
        print(f"  [{i}] {short}")
    print(f"{'='*60}")


class ProfilingTest(TestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email="profadmin@clinic.com", password="pass", role="admin"
        )
        self.doctor_user = User.objects.create_user(
            email="profdoc@clinic.com", password="pass", role="doctor",
            first_name="Prof", last_name="Doctor",
        )
        self.spec = Specialization.objects.create(title="Терапия", cost=5000)
        self.svc = Service.objects.create(title="Пломба", spec_id=self.spec)
        self.doctor = Doctors.objects.create(
            user=self.doctor_user,
            first_name="Prof", last_name="Doctor", father_name="Test",
            services_id=self.svc,
        )
        self.gender = Gender.objects.create(gender_name="Мужской")
        self.find_out = FindOut.objects.create(find_out_name="Интернет")

        self.admin_api = APIClient()
        self.admin_api.force_authenticate(user=self.admin)
        self.doctor_api = APIClient()
        self.doctor_api.force_authenticate(user=self.doctor_user)

        self.status = Status.objects.create(title="Ожидает")
        self.chair = ChairNum.objects.create(title="Кабинет 1")
        self.rec_type = RecordingType.objects.create(title="Первичный")
        self.pay_type = PaymentType.objects.create(title="Наличные")
        self.pay_state = PaymentState.objects.create(title="Не оплачено")
        self.today = datetime.date.today()

        # Create patients
        self.patients = []
        for i in range(DATASET_SIZE):
            p = Client.objects.create(
                first_name=f"Имя{i}", last_name=f"Фамилия{i}",
                father_name="О.", gender=self.gender,
                find_out=self.find_out, doctor=self.doctor,
                mobile_phone=f"+7700{i:07d}",
            )
            self.patients.append(p)

        # Create records for first patient
        for i in range(DATASET_SIZE):
            Record.objects.create(
                client=self.patients[0],
                client_first_name="Имя0", client_last_name="Фамилия0",
                client_father_name="О.", doctor=self.doctor,
                doctors_name="Doctor Prof", assistant=None, assistant_name="",
                service=self.svc, specialization=self.spec,
                tooth=11 + i % 20, specialization_cost=5000, count=1, sell=0, total=5000,
                registration_date=self.today, record_start=self.today,
                record_end=self.today, reception_day=self.today,
                recording_type=self.rec_type, chair=self.chair,
                payment_type=self.pay_type, payment_state=self.pay_state,
                status=self.status,
            )

        # Create extra doctors and services
        for i in range(DATASET_SIZE):
            spec = Specialization.objects.create(title=f"Спец{i}", cost=3000 + i)
            svc = Service.objects.create(title=f"Услуга{i}", spec_id=spec)
            Doctors.objects.create(
                first_name=f"Врач{i}", last_name=f"Фам{i}",
                father_name="О.", services_id=svc,
            )

        # Create treatment plan items
        for i in range(DATASET_SIZE):
            TreatmentPlanItem.objects.create(
                patient=self.patients[0],
                tooth_number=str(i % 32 + 1),
                diagnosis=f"Кариес {i}", treatment=f"Пломба {i}",
                service=self.svc, doctor=self.admin,
            )

        # Create teeth
        for n in range(1, 33):
            ToothRecord.objects.create(
                patient=self.patients[0],
                tooth_number=str(n), updated_by=self.admin,
            )

        self.patient0_id = self.patients[0].id

    def test_profile_all_endpoints(self):
        """Print a full SQL profile for every key endpoint. Never fails — just reports."""
        endpoints = [
            ("admin", "get", "/api/v1/clients/"),
            ("admin", "get", "/api/v1/clients/?search=Имя1"),
            ("admin", "get", "/api/v1/doctors/"),
            ("admin", "get", "/api/v1/services/"),
            ("admin", "get", "/api/v1/records/"),
            ("admin", "get", f"/api/v1/records/?reception_day={self.today}"),
            ("admin", "get", f"/api/v1/medical/{self.patient0_id}/note/"),
            ("doctor", "get", f"/api/v1/medical/{self.patient0_id}/note/"),
            ("admin", "get", f"/api/v1/medical/{self.patient0_id}/teeth/"),
            ("admin", "get", f"/api/v1/medical/{self.patient0_id}/plan/"),
        ]

        print(f"\n\n{'#'*60}")
        print(f"  PROFILING REPORT — dataset size: {DATASET_SIZE}")
        print(f"{'#'*60}")

        for role, method, url in endpoints:
            api = self.admin_api if role == "admin" else self.doctor_api
            report = _profile(api, method, url)
            _print_report(f"[{role.upper()}] {method} {url}", report)

        # This test always passes — it's a profiling run, not a regression guard
        self.assertTrue(True)

    def test_duplicate_queries_clients(self):
        """Fail if any SQL is executed more than once in a client list request."""
        report = _profile(self.admin_api, "get", "/api/v1/clients/")
        if report["dupes"]:
            dupe_summary = "\n".join(
                f"  x{cnt}: {sql[:100]}" for sql, cnt in report["dupes"]
            )
            self.fail(
                f"Client list ran {len(report['dupes'])} query/queries more than once:\n{dupe_summary}"
            )

    def test_duplicate_queries_records(self):
        """Fail if any SQL is executed more than once in a records list request."""
        report = _profile(self.admin_api, "get", "/api/v1/records/")
        if report["dupes"]:
            dupe_summary = "\n".join(
                f"  x{cnt}: {sql[:100]}" for sql, cnt in report["dupes"]
            )
            self.fail(
                f"Records list ran duplicate queries:\n{dupe_summary}"
            )

    def test_duplicate_queries_doctors(self):
        """Fail if any SQL is executed more than once in a doctors list request."""
        report = _profile(self.admin_api, "get", "/api/v1/doctors/")
        if report["dupes"]:
            dupe_summary = "\n".join(
                f"  x{cnt}: {sql[:100]}" for sql, cnt in report["dupes"]
            )
            self.fail(
                f"Doctors list ran duplicate queries:\n{dupe_summary}"
            )

    def test_doctor_auth_query_overhead(self):
        """
        Doctor accessing a medical note should not issue more than 1 extra query
        compared to admin (the doctors_profile reverse-OneToOne lookup).
        """
        admin_report = _profile(self.admin_api, "get", f"/api/v1/medical/{self.patient0_id}/note/")
        doctor_report = _profile(self.doctor_api, "get", f"/api/v1/medical/{self.patient0_id}/note/")
        overhead = doctor_report["count"] - admin_report["count"]
        print(f"\n[auth overhead] admin={admin_report['count']}q, doctor={doctor_report['count']}q, overhead={overhead}")
        self.assertLessEqual(
            overhead, 1,
            f"Doctor auth path adds {overhead} extra queries vs admin — "
            f"expected ≤ 1 (one reverse-OneToOne for doctors_profile).",
        )
