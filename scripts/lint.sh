#!/bin/bash
# Проверить код на стиль flake8
python3 -m flake8 ExPlast/sitebuilder/backend/app/crud.py \
    ExPlast/sitebuilder/backend/app/database.py \
    ExPlast/sitebuilder/backend/app/exporter.py
