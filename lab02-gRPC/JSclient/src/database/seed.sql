-- Sample data of the Film Manager database.
-- Loaded on startup when RESET_DB=true. The plain-text passwords are listed in passwords_databases.txt.

INSERT INTO users VALUES(1,'user.dsp@polito.it','User','$2a$10$.hw.euW0lGhWtNfigv5U9uEcwc1cfgH3DK7.zReNHPvi5xpJRfPc2');
INSERT INTO users VALUES(2,'frank.stein@polito.it','Frank','$2a$10$YBUtQ7qWvOo9xBuJfLWAkeTHmQHZe0uB0NM/7zAITHCccGVAfOkEm');
INSERT INTO users VALUES(3,'karen.makise@polito.it','Karen','$2a$10$d9pllxqTsXoAXJwE14VzzeJPJc6Z1igrR2/jfa1IQeAb5pNPfYViS');
INSERT INTO users VALUES(4,'rene.regeay@polito.it','Rene','$2a$10$WJcNTzEY1rIePhRVKdfkYeSkVJ20PLMEktgdjVPJq9qUeP1ZdSrPi');
INSERT INTO users VALUES(5,'beatrice.golden@polito.it','Beatrice','$2a$10$wQtLnqD224VS3US.LCrWXOWfASq6PZJHEpViYV6GEKUXWxMZNmSTW');
INSERT INTO users VALUES(6,'arthur.pendragon@polito.it','Arthur','$2a$10$uFVLA5yq4LZTB.gglOqsReDsm.KgeRrhcSy4T45Dlh.yWyR.uYA7a');

INSERT INTO films VALUES(1,'Your Name',1,1,'2021-10-03',9,1);
INSERT INTO films VALUES(2,'Heaven''s Feel',2,0,NULL,NULL,NULL);
INSERT INTO films VALUES(3,'You Can (Not) Redo',1,0,NULL,NULL,NULL);
INSERT INTO films VALUES(4,'Weathering with You',1,1,NULL,NULL,NULL);
INSERT INTO films VALUES(5,'Aria of a Starless Night',3,1,'2022-07-20',8,0);
INSERT INTO films VALUES(6,'Spirited Away',5,0,NULL,NULL,NULL);
INSERT INTO films VALUES(7,'5 Centimeters Per Second',5,0,NULL,NULL,NULL);
INSERT INTO films VALUES(8,'Nausicaa',5,1,'2020-03-15',9,0);
INSERT INTO films VALUES(9,'The Garden of Words',1,0,NULL,NULL,NULL);
INSERT INTO films VALUES(10,'Paradox Spiral',4,1,'2021-12-26',10,1);

INSERT INTO reviews VALUES(2,2,1,'2022-04-04',10,'I could not stop watching until the very end. However, you must watch the prequels before this film to really understand it.');
INSERT INTO reviews VALUES(2,5,1,'2022-03-04',10,'This film is a perfect conclusion for the trilogy.');
INSERT INTO reviews VALUES(3,1,1,'2022-01-23',9,'I appreciated the plot twists, but I did not understand so much the ending. I am eagerly waiting for the sequel.');
INSERT INTO reviews VALUES(3,2,1,'2022-04-04',8,'I would have preferred that this film did not adopt the widescreen cinema standard resolution.');
INSERT INTO reviews VALUES(4,1,0,'2020-01-01',NULL,NULL);
INSERT INTO reviews VALUES(6,1,0,NULL,NULL,NULL);
INSERT INTO reviews VALUES(6,5,0,NULL,NULL,NULL);
INSERT INTO reviews VALUES(7,5,1,'2022-03-04',7,'The ending feels rushed and it should have better explained the life decisions of the characters.');
INSERT INTO reviews VALUES(9,4,0,NULL,NULL,NULL);
INSERT INTO reviews VALUES(9,5,1,'2022-04-04',9,'Even if the film is short, it provides a deep characterizaition for the two main characters.');
