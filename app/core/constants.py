from enum import Enum


class PersonaType(str, Enum):
    SUPER_ADMIN = "super_admin"
    HEADMASTER = "headmaster"
    TEACHER = "teacher"
    STUDENT = "student"
