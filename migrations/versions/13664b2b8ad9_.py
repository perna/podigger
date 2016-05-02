"""empty message

Revision ID: 13664b2b8ad9
Revises: 2298408681b6
Create Date: 2016-04-24 19:25:55.670290

"""

# revision identifiers, used by Alembic.
revision = '13664b2b8ad9'
down_revision = '2298408681b6'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('episode_title_key', 'episode', type_='unique')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_unique_constraint('episode_title_key', 'episode', ['title'])
    ### end Alembic commands ###