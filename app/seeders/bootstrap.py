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
    """
    logger.info("Initializing system bootstrap...")
    
    # Version 1: Initial permissions catalog and default Super Admin role setup
    version_1 = db.query(SeedVersion).filter(SeedVersion.version == 1).first()
    
    if not version_1:
        try:
            logger.info("Applying Seed Version 1: Seeding core system permissions...")
            seed_permissions(db)
            
            # Seed default system roles for any pre-existing organizations
            organizations = db.query(Organization).filter(Organization.deleted_at == None).all()
            for org in organizations:
                logger.info(f"Seeding default roles for organization: {org.name} ({org.slug})")
                seed_system_roles(db, org.id)
            
            # Save seed run version in DB
            record = SeedVersion(
                version=1,
                name="Initial permissions & Super Admin role setup"
            )
            db.add(record)
            db.commit()
            logger.info("Seed Version 1 applied successfully!")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error during Seed Version 1 application: {e}")
            raise e
    else:
        logger.info("Seed Version 1 is already applied. Skipping...")
        return False
