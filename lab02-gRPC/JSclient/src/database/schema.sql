-- Schema of the Film Manager database.
-- Executed on startup when the database file does not exist, or when RESET_DB=true.

CREATE TABLE "users" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"email"	TEXT NOT NULL,
	"name"	TEXT,
	"hash"	TEXT NOT NULL
);

CREATE TABLE "films" (
	"id"	INTEGER,
	"title"	TEXT NOT NULL,
	"owner"	INTEGER NOT NULL,
	"private"	INTEGER NOT NULL DEFAULT 1,
	"watchDate"	TEXT,
	"rating"	INTEGER,
	"favorite"	INTEGER,
	PRIMARY KEY("id"),
	FOREIGN KEY("owner") REFERENCES "users"("id")
);

CREATE TABLE "reviews" (
	"filmId"	INTEGER,
	"reviewerId"	INTEGER,
	"completed"	INTEGER NOT NULL DEFAULT 0,
	"reviewDate"	TEXT,
	"rating"	INTEGER,
	"review"	TEXT,
	PRIMARY KEY("filmId","reviewerId"),
	FOREIGN KEY("filmId") REFERENCES "films"("id"),
	FOREIGN KEY("reviewerId") REFERENCES "users"("id")
);

CREATE TABLE "images" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	"filmId"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	FOREIGN KEY("filmId") REFERENCES "films"("id")
);
