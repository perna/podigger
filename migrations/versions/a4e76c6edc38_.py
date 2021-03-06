"""empty message

Revision ID: a4e76c6edc38
Revises: 95b81f5e2452
Create Date: 2016-08-23 17:23:33.115957

"""

# revision identifiers, used by Alembic.
revision = 'a4e76c6edc38'
down_revision = '95b81f5e2452'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('podcast', sa.Column('image', sa.String(), nullable=True))
    op.add_column('podcast_language', sa.Column('code', sa.String(length=5), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('podcast_language', 'code')
    op.drop_column('podcast', 'image')
    ### end Alembic commands ###
