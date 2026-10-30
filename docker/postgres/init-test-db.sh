#!/bin/sh
# Creates a separate database for the backend integration tests.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  CREATE DATABASE todo_test;
SQL
