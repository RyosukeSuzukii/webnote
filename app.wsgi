#!/usr/bin/ python3
# -*- coding:utf-8 -*-

import sys

# パスの指定
sys.path.insert(0, '/var/www/site')
from app import app
application = app