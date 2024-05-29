import psycopg2
import requests
import json
import base64
import os

USERNAME = 'NUSnextbus'
PASSWORD = os.environ['NUSNEXTBUS']
encoded_credentials = base64.b64encode(
    f"{USERNAME}:{PASSWORD}".encode('utf-8')).decode('utf-8')
headers = {
    'Authorization': f'Basic {encoded_credentials}'
}
base_url = "https://nnextbus.nus.edu.sg"
conn = psycopg2.connect(database = "main",
                        user = 'postgres',
                        host = 'localhost',
                        password = 'leyew123',
                        port = 5432)

def fetch_nus_bus_stops():
    url_extension = "/BusStops"
    result_url = base_url + url_extension
    response = requests.get(result_url, headers=headers)
    resulting_dict = json.loads(response.text)
    arbit_id_count = 1
    for stop in resulting_dict["BusStopsResult"]['busstops']:
        name = stop["name"]
        id = arbit_id_count
        lat = stop["latitude"]
        longitude = stop["longitude"]
        cur = conn.cursor()
        cur.execute("""INSERT INTO busstops(id, latitude, longitude, name, status)
                    VALUES(%s, %s, %s, %s, %s )""",  (id, lat, longitude, name, True))
        conn.commit()
        arbit_id_count += 1


def fetch_public_bus_stops():
    # fetches the data from public_bus_stops
    with open("public_bus_stops.json", "r") as f:
        read = json.load(f)
        for stop in read:
            id = stop["ID"]
            name = stop["NAME"]
            lat = stop["Latitude"]
            longitude = stop["Longitude"]
            cur = conn.cursor()
            cur.execute("""INSERT INTO busstops(id, latitude, longitude, name, status)
                        VALUES(%s, %s, %s, %s, %s )""",  (id, lat, longitude, name, True))
            conn.commit()


if __name__ == "__main__":
    fetch_nus_bus_stops()
    fetch_public_bus_stops()
