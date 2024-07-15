import psycopg2
import os
import dotenv
dotenv.load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    sslmode="require"
)

cursor = conn.cursor()

# Key = NUS bus stop name
# Value = LTA Datamall bus stop ID
PUBLICNUSBUSSTOPS = {
  "CG": 41029,
  "JP-SCH-16151": 16151,
  "RAFFLES": 16169,
  "MUSEUM": 16161,
  "YIH-OPP": 16179,
  "YIH": 16171,
  "SDE3-OPP": 16149,
  "UHC": 18321,
  "UHC-OPP": 18329,
  "IT": 16189,
  "CLB": 16181,
  "UHALL-OPP": 18319,
  "UHALL": 18311,
  "S17": 18309,
  "LT27": 18301,
  "KRB": 16009,
  "KR-MRT": 18331,
  "KR-MRT-OPP": 18339,
}

def updateTable():
  # Extracting bus stop IDs from the dictionary
  bus_stop_ids = list(PUBLICNUSBUSSTOPS.values())

  # Creating the DELETE query
  delete_query = "DELETE FROM busstops WHERE id = ANY(%s)"

  # Executing the query
  cursor.execute(delete_query, (bus_stop_ids,))

  # Committing the transaction
  conn.commit()

# Call my function
updateTable()

# Closing the cursor and connection
cursor.close()
conn.close()
