-- This SQL DDL script defines the schema for a PostgreSQL database to manage 'état des lieux' (property inventory) forms.
-- It is designed to be compatible with Supabase.

-- Enable the uuid-ossp extension for generating UUIDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: etat_des_lieux
-- Stores general information about each property inventory form.
CREATE TABLE etat_des_lieux (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each 'état des lieux' record.
    date_entree DATE, -- Date of entry inventory.
    date_sortie DATE, -- Date of exit inventory.
    adresse_bien TEXT NOT NULL, -- Address of the property.
    bailleur_nom TEXT, -- Name of the landlord or their representative.
    bailleur_adresse TEXT, -- Address of the landlord or their representative.
    locataire_nom TEXT, -- Name of the tenant(s).
    locataire_adresse TEXT -- Address of the tenant(s).
);

-- Table: releve_compteurs
-- Stores meter readings for electricity, gas, and water.
CREATE TABLE releve_compteurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each meter reading record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    nom_ancien_occupant TEXT, -- Name of the previous occupant for meter transfer.
    electricite_n_compteur TEXT, -- Electricity meter number.
    electricite_h_pleines TEXT, -- Electricity reading during peak hours.
    electricite_h_creuses TEXT, -- Electricity reading during off-peak hours.
    gaz_naturel_n_compteur TEXT, -- Natural gas meter number.
    gaz_naturel_releve TEXT, -- Natural gas reading.
    eau_chaude_m3 TEXT, -- Hot water consumption in cubic meters.
    eau_froide_m3 TEXT -- Cold water consumption in cubic meters.
);

-- Table: equipements_energetiques
-- Stores information about the type of heating and hot water systems.
CREATE TABLE equipements_energetiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each energy equipment record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    chauffage_type TEXT, -- Type of heating (e.g., electric, gas, collective, other).
    eau_chaude_type TEXT -- Type of hot water system (e.g., electric, gas, collective, other).
);

-- Table: equipements_chauffage
-- Stores details about heating equipment like boiler and water heater.
CREATE TABLE equipements_chauffage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each heating equipment record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    chaudiere_etat TEXT, -- Condition of the boiler.
    chaudiere_date_dernier_entretien DATE, -- Date of the last boiler maintenance.
    ballon_eau_chaude_etat TEXT -- Condition of the hot water tank.
);

-- Table: cles
-- Stores information about keys and badges provided with the property.
CREATE TABLE cles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each key record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    type_cle_badge TEXT, -- Type of key or badge.
    nombre INTEGER, -- Number of keys/badges of this type.
    commentaires TEXT -- Additional comments about the keys/badges.
);

-- Table: parties_privatives
-- Stores the condition of private areas attached to the dwelling (e.g., cellar, parking, garden, balcony).
CREATE TABLE parties_privatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each private area record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    type_partie TEXT NOT NULL, -- Type of private area (e.g., Cave, Parking / Box / Garage, Jardin, Balcon / Terrasse).
    etat_entree TEXT, -- Condition at entry.
    etat_sortie TEXT, -- Condition at exit.
    numero TEXT, -- Number or identifier for the private area (e.g., parking spot number).
    commentaires TEXT -- Additional comments about the private area.
);

-- Table: autres_equipements
-- Stores the condition of other general equipment and amenities.
CREATE TABLE autres_equipements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each other equipment record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    equipement TEXT NOT NULL, -- Name of the equipment (e.g., Sonnette / Interphone, Boite aux lettres, Internet).
    etat_entree TEXT, -- Condition at entry.
    etat_sortie TEXT, -- Condition at exit.
    commentaires TEXT -- Additional comments about the equipment.
);

-- Table: pieces
-- Stores the condition of various elements within each room (e.g., living room, WC, bathroom, kitchen).
CREATE TABLE pieces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each room element record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    nom_piece TEXT NOT NULL, -- Name of the room (e.g., Salon / Pièce à vivre, WC, Salle de bain, Coin cuisine).
    revetements_sols_entree TEXT, -- Condition of floor coverings at entry.
    revetements_sols_sortie TEXT, -- Condition of floor coverings at exit.
    murs_menuiseries_entree TEXT, -- Condition of walls/woodwork at entry.
    murs_menuiseries_sortie TEXT, -- Condition of walls/woodwork at exit.
    plafond_entree TEXT, -- Condition of ceiling at entry.
    plafond_sortie TEXT, -- Condition of ceiling at exit.
    electricite_plomberie_entree TEXT, -- Condition of electricity/plumbing at entry.
    electricite_plomberie_sortie TEXT, -- Condition of electricity/plumbing at exit.
    placards_entree TEXT, -- Condition of cupboards at entry (specific to WC/living room).
    placards_sortie TEXT, -- Condition of cupboards at exit (specific to WC/living room).
    sanitaires_entree TEXT, -- Condition of sanitary facilities at entry (specific to WC).
    sanitaires_sortie TEXT, -- Condition of sanitary facilities at exit (specific to WC).
    menuiseries_entree TEXT, -- Condition of woodwork at entry (specific to bathroom/kitchen).
    menuiseries_sortie TEXT, -- Condition of woodwork at exit (specific to bathroom/kitchen).
    rangements_entree TEXT, -- Condition of storage units at entry (specific to bathroom).
    rangements_sortie TEXT, -- Condition of storage units at exit (specific to bathroom).
    baignoire_douche_entree TEXT, -- Condition of bathtub/shower at entry.
    baignoire_douche_sortie TEXT, -- Condition of bathtub/shower at exit.
    eviers_robinetterie_entree TEXT, -- Condition of sinks/taps at entry.
    eviers_robinetterie_sortie TEXT, -- Condition of sinks/taps at exit.
    chauffage_tuyauterie_entree TEXT, -- Condition of heating/piping at entry (specific to kitchen).
    chauffage_tuyauterie_sortie TEXT, -- Condition of heating/piping at exit (specific to kitchen).
    meubles_cuisine_entree TEXT, -- Condition of kitchen furniture at entry.
    meubles_cuisine_sortie TEXT, -- Condition of kitchen furniture at exit.
    hotte_entree TEXT, -- Condition of hood at entry.
    hotte_sortie TEXT, -- Condition of hood at exit.
    plaque_cuisson_entree TEXT, -- Condition of hob at entry.
    plaque_cuisson_sortie TEXT, -- Condition of hob at exit.
    commentaires TEXT -- Additional comments for the room.
);
