"""User domain models and enums"""

from enum import Enum


class UserRole(str, Enum):
    """Role of a user in the system"""

    ADMIN = "admin"
    STAFF = "staff"
    CAPTAIN = "captain"
    CUSTOMER = "customer"
