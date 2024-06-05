import json

def addBusServicesAttribute():
  # Read the JSON data from the file
  with open("public_bus_stops.json") as f:
    bus_stops = json.load(f)

  # Modify the JSON data
  for bus_stop in bus_stops:
      bus_stop["BusServices"] = []

  # Write the modified JSON data back to the file
  with open("public_bus_stops.json", 'w') as f:
      json.dump(bus_stops, f, indent=4)

  print("Modifications have been written back to the file.")

# converts the array of bus stops to a dictionary
# key = bus stop id, value = details of bus stop
def convertArrayToDict():
  with open("public_bus_stops.json") as f:
    bus_stops = json.load(f)

    bus_stops_dict = {
        bus_stop["ID"]: {key: value for key, value in bus_stop.items() if key != "ID"}
        for bus_stop in bus_stops
    }
    with open("public_bus_stops.json", 'w') as f:
      json.dump(bus_stops_dict, f, indent=4)


def populateBusServices():
  with open("public_bus_stops.json") as f:
    bus_stops = json.load(f)

  with open("bus-routes.datamall.json") as ff:
    bus_routes = json.load(ff)
    
  for bus_route in bus_routes:
    stop_code = bus_route["BusStopCode"]
    service_number = bus_route["ServiceNo"]

    bus_stops[stop_code]["BusServices"].append(service_number)

  # write changes back to file
  with open("public_bus_stops.json", "w") as f:
    json.dump(bus_stops, f, indent=4)

populateBusServices()