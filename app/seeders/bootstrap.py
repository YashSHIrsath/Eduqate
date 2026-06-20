import logging
from sqlalchemy.orm import Session
from app.models.seed_version import SeedVersion
from app.models.organization import Organization
from app.seeders.permissions import seed_permissions
from app.seeders.roles import seed_system_roles

logger = logging.getLogger("eduqate.bootstrap")


def bootstrap_system(db: Session) -> bool:
    """
    Bootstraps the platform with standard permissions, roles, and seed version tracking.
    Each version block is idempotent and runs only once.
    """
    logger.info("Initializing system bootstrap...")
    ran_any = False

    # ------------------------------------------------------------------
    # Version 1: Core permissions + Super Admin role
    # ------------------------------------------------------------------
    if not db.query(SeedVersion).filter(SeedVersion.version == 1).first():
        try:
            logger.info("Applying Seed Version 1: core permissions and Super Admin role...")
            seed_permissions(db)

            organizations = db.query(Organization).filter(Organization.deleted_at == None).all()
            for org in organizations:
                logger.info(f"Seeding Super Admin role for: {org.name}")
                seed_system_roles(db, org.id)

            db.add(SeedVersion(version=1, name="Initial permissions & Super Admin role setup"))
            db.commit()
            logger.info("Seed Version 1 applied successfully.")
            ran_any = True
        except Exception as e:
            db.rollback()
            logger.error(f"Seed Version 1 failed: {e}")
            raise

    else:
        logger.info("Seed Version 1 already applied. Skipping.")

    # ------------------------------------------------------------------
    # Version 2: Persona architecture — Headmaster, Teacher, Student roles
    # ------------------------------------------------------------------
    if not db.query(SeedVersion).filter(SeedVersion.version == 2).first():
        try:
            logger.info("Applying Seed Version 2: persona system roles and expanded permissions...")

            # Sync expanded permission catalog (adds new teacher/student permissions)
            seed_permissions(db)

            # Seed / update all four system roles per organization
            organizations = db.query(Organization).filter(Organization.deleted_at == None).all()
            for org in organizations:
                logger.info(f"Seeding persona system roles for: {org.name}")
                seed_system_roles(db, org.id)

            db.add(SeedVersion(version=2, name="Persona architecture: Headmaster, Teacher, Student system roles"))
            db.commit()
            logger.info("Seed Version 2 applied successfully.")
            ran_any = True
        except Exception as e:
            db.rollback()
            logger.error(f"Seed Version 2 failed: {e}")
            raise

    else:
        logger.info("Seed Version 2 already applied. Skipping.")

    return ran_any
