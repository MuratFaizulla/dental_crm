import logging
from typing import Protocol

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class SMSProvider(Protocol):
    def send(self, phone: str, message: str) -> tuple[bool, str]:
        """Return (success, provider_response)."""
        ...


class StubProvider:
    """Logs SMS to console — use in dev/test. No real SMS is sent."""

    def send(self, phone: str, message: str) -> tuple[bool, str]:
        logger.info('[SMS STUB] To: %s | Text: %s', phone, message)
        return True, 'stub:ok'


class SMSKzProvider:
    """SMS.kz HTTP API provider."""

    API_URL = 'https://api.sms.kz/sms/2/text/plain'

    def send(self, phone: str, message: str) -> tuple[bool, str]:
        try:
            resp = requests.post(
                self.API_URL,
                json={
                    'login': settings.SMS_KZ_LOGIN,
                    'password': settings.SMS_KZ_PASSWORD,
                    'sender': settings.SMS_KZ_SENDER,
                    'msisdn': phone,
                    'text': message,
                },
                timeout=10,
            )
            body = resp.text[:500]
            if resp.status_code == 200:
                return True, body
            logger.warning('SMS.kz error %s: %s', resp.status_code, body)
            return False, body
        except requests.RequestException as exc:
            logger.error('SMS.kz request failed: %s', exc)
            return False, str(exc)


def get_provider() -> SMSProvider:
    provider_name = getattr(settings, 'SMS_PROVIDER', 'stub')
    if provider_name == 'smskz':
        return SMSKzProvider()
    return StubProvider()
