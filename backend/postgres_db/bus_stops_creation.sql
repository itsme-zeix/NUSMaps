CREATE TABLE busStops(
    id INT NOT NULL,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    name VARCHAR(255) NOT NULL,
    status BOOL NOT NULL,
    services jsonb[]--jsonb is a json object, the [] denotes an array of json objects--
);