"""Add persona_type to users and roles

Revision ID: d581343ad9ae
Revises: 658e7ec85871
Create Date: 2026-06-20

Adds persona_type (VARCHAR 50, NOT NULL) to both users and roles tables.

Backfill strategy:
  - All existing users   → 'super_admin'  (only platform bootstrappers exist at this point)
  - Existing 'Super Admin' role → 'super_admin'
  - Any other pre-existing custom roles → 'super_admin' as a safe default;
    an admin must reassign them to the correct persona before using them.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd581343ad9ae'
down_revision: Union[str, Sequence[str], None] = '619dff4ddf53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users: add nullable first, backfill, then enforce NOT NULL ---
    op.add_column('users', sa.Column('persona_type', sa.String(length=50), nullable=True))
    op.execute("UPDATE users SET persona_type = 'super_admin' WHERE persona_type IS NULL")
    op.alter_column('users', 'persona_type', nullable=False)

    # --- roles: add nullable first, backfill, then enforce NOT NULL ---
    op.add_column('roles', sa.Column('persona_type', sa.String(length=50), nullable=True))
    op.execute("UPDATE roles SET persona_type = 'super_admin' WHERE name = 'Super Admin'")
    # Fallback for any other pre-existing custom roles
    op.execute("UPDATE roles SET persona_type = 'super_admin' WHERE persona_type IS NULL")
    op.alter_column('roles', 'persona_type', nullable=False)


def downgrade() -> None:
    op.drop_column('roles', 'persona_type')
    op.drop_column('users', 'persona_type')
