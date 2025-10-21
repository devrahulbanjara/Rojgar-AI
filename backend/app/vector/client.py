from sentence_transformers import SentenceTransformer
import numpy as np
import json
import pandas as pd
import pandas as pd
import sqlite3
conn = sqlite3.connect('convexhire.db')
sql_query = "SELECT * FROM job;"
df = pd.read_sql_query(sql_query, conn)
print(df.head(2))