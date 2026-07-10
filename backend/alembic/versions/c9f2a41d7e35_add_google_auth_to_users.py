"""add google auth to users

Revision ID: c9f2a41d7e35
Revises: 3d1c19bb0a88
Create Date: 2026-07-09 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9f2a41d7e35'
down_revision: Union[str, None] = '3d1c19bb0a88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # email já foi criado (NOT NULL + unique) pela 3d1c19bb0a88
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    # usuários criados via Google não têm senha e violariam o NOT NULL restaurado
    op.execute("DELETE FROM users WHERE password_hash IS NULL")
    op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=False)
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'google_id')
