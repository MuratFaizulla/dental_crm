import secrets
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

OTP_TTL = 300  # 5 minutes


def generate_otp(identifier: str) -> str:
    code = str(secrets.randbelow(900000) + 100000)
    cache.set(f'otp:{identifier}', code, timeout=OTP_TTL)
    if settings.DEBUG:
        logger.debug('[OTP STUB] code for %s: %s', identifier, code)
    return code


def verify_otp(identifier: str, code: str) -> bool:
    stored = cache.get(f'otp:{identifier}')
    if stored and stored == code:
        cache.delete(f'otp:{identifier}')
        return True
    return False
