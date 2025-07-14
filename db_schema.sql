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
    statut TEXT, -- Status of the inventory (e.g., 'en_cours', 'termine')
    type_etat_des_lieux TEXT NOT NULL CHECK (type_etat_des_lieux IN ('entree', 'sortie')), -- Type of inventory: entry or exit
    type_bien TEXT NOT NULL CHECK (type_bien IN ('studio', 't2_t3', 't4_t5', 'inventaire_mobilier', 'bureau', 'local_commercial', 'garage_box', 'pieces_supplementaires')), -- Type of property
    bailleur_nom TEXT, -- Name of the landlord or their representative.
    bailleur_adresse TEXT, -- Address of the landlord or their representative.
    locataire_nom TEXT, -- Name of the tenant(s).
    locataire_adresse TEXT, -- Address of the tenant(s).
    rendez_vous_id UUID, -- Foreign key linking to the appointment that led to this inventory.
    travaux_a_faire BOOLEAN DEFAULT FALSE, -- Indicates if work is needed following the inventory (TRUE/FALSE).
    description_travaux TEXT, -- Detailed description of work to be done (optional if travaux_a_faire = TRUE).
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with the inventory.
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
    eau_chaude_type TEXT, -- Type of hot water system (e.g., electric, gas, collective, other).
    dpe_classe TEXT, -- DPE (Diagnostic de Performance Énergétique) class (e.g., 'A', 'B', 'C').
    ges_classe TEXT, -- GES (Gaz à Effet de Serre) class (e.g., 'A', 'B', 'C').
    date_dpe DATE, -- Date of the DPE.
    presence_panneaux_solaires BOOLEAN, -- Indicates presence of solar panels.
    type_isolation TEXT, -- Type of insulation (e.g., 'interieure', 'exterieure', 'combles').
    commentaires TEXT, -- Comments and observations about energy equipment.
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with energy equipment.
);

-- Table: equipements_chauffage
-- Stores details about heating equipment like boiler and water heater.
CREATE TABLE equipements_chauffage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each heating equipment record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    chaudiere_etat TEXT, -- Condition of the boiler.
    chaudiere_date_dernier_entretien DATE, -- Date of the last boiler maintenance.
    ballon_eau_chaude_etat TEXT, -- Condition of the hot water tank.
    radiateurs_nombre INTEGER, -- Number of radiators.
    radiateurs_etat TEXT, -- General condition of radiators.
    thermostat_present BOOLEAN, -- Indicates presence of a thermostat.
    thermostat_etat TEXT, -- Condition of the thermostat.
    pompe_a_chaleur_present BOOLEAN, -- Indicates presence of a heat pump.
    pompe_a_chaleur_etat TEXT, -- Condition of the heat pump.
    commentaires TEXT, -- Comments and observations about heating equipment.
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with heating equipment.
);

-- Table: cles
-- Stores information about keys and badges provided with the property.
CREATE TABLE cles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each key record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    type_cle_badge TEXT, -- Type of key or badge (e.g., 'clé porte entrée', 'clé boîte aux lettres', 'bip portail', 'badge immeuble').
    nombre INTEGER, -- Number of keys/badges of this type.
    numero_cle TEXT, -- Key number or reference.
    commentaires TEXT, -- Additional comments about the keys/badges.
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with keys/badges.
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
    commentaires TEXT, -- Additional comments about the private area.
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with private areas.
);

-- Table: autres_equipements
-- Stores the condition of other general equipment and amenities.
CREATE TABLE autres_equipements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each other equipment record.
    etat_des_lieux_id UUID REFERENCES etat_des_lieux(id), -- Foreign key linking to the main 'état des lieux' record.
    equipement TEXT NOT NULL, -- Name of the equipment (e.g., 'Sonnette / Interphone', 'Boîte aux lettres', 'Internet', 'Alarme', 'Détecteur de fumée', 'VMC', 'Cheminée', 'Piscine', 'Jacuzzi', 'Sauna', 'Portail électrique', 'Volets roulants électriques', 'Store banne').
    etat_entree TEXT, -- Condition at entry.
    etat_sortie TEXT, -- Condition at exit.
    commentaires TEXT, -- Additional comments about the equipment.
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with other equipment.
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
    commentaires TEXT, -- Additional comments for the room.
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with room elements.
);

-- Table: rendez_vous
-- Stores information about scheduled appointments for property inventories.
CREATE TABLE rendez_vous (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each appointment.
    date DATE NOT NULL, -- Date of the appointment.
    heure TIME NOT NULL, -- Time of the appointment.
    duree TEXT, -- Planned duration of the appointment (e.g., "1h30").
    description TEXT, -- Description or purpose of the appointment.
    adresse TEXT NOT NULL, -- Address where the appointment will take place.
    code_postal TEXT NOT NULL, -- Postal code for the address.
    ville TEXT NOT NULL, -- City for the address.
    latitude FLOAT, -- Latitude for precise location (optional).
    longitude FLOAT, -- Longitude for precise location (optional).
    nom_contact TEXT NOT NULL, -- Name of the person to contact for the appointment.
    telephone_contact TEXT NOT NULL, -- Phone number of the contact person.
    email_contact TEXT NOT NULL, -- Email address of the contact person.
    note_personnelle TEXT, -- Any personal notes regarding the appointment.
    type_etat_des_lieux TEXT, -- Type of inventory (e.g., "entree", "sortie").
    type_bien TEXT, -- Type of property (e.g., "studio", "t2-t3", "local").
    created_at TIMESTAMPTZ DEFAULT now(), -- Timestamp of when the appointment was created.
    statut TEXT DEFAULT 'planifie' CHECK (statut IN ('planifie', 'realise', 'annule', 'reporte')), -- Status of the appointment.
    etat_des_lieux_id UUID, -- Reference to the inventory created from this appointment.
    photos jsonb DEFAULT '[]'::jsonb -- Photos associated with the appointment.
);

-- Add foreign key constraints after table creation to avoid circular dependency issues
ALTER TABLE etat_des_lieux 
ADD CONSTRAINT fk_etat_des_lieux_rendez_vous 
FOREIGN KEY (rendez_vous_id) REFERENCES rendez_vous(id);

ALTER TABLE rendez_vous 
ADD CONSTRAINT fk_rendez_vous_etat_des_lieux 
FOREIGN KEY (etat_des_lieux_id) REFERENCES etat_des_lieux(id);

-- Add comments for documentation
COMMENT ON COLUMN etat_des_lieux.rendez_vous_id IS 'Référence vers le rendez-vous qui a donné lieu à cet état des lieux';
COMMENT ON COLUMN etat_des_lieux.travaux_a_faire IS 'Indique si des travaux sont nécessaires suite à l''état des lieux (TRUE/FALSE)';
COMMENT ON COLUMN etat_des_lieux.description_travaux IS 'Description détaillée des travaux à effectuer (optionnel si travaux_a_faire = TRUE)';
COMMENT ON COLUMN rendez_vous.statut IS 'Statut du rendez-vous: planifie, realise, annule, reporte';
COMMENT ON COLUMN rendez_vous.etat_des_lieux_id IS 'Référence vers l''état des lieux créé suite à ce rendez-vous';
COMMENT ON COLUMN equipements_energetiques.commentaires IS 'Commentaires et observations sur les équipements énergétiques';
COMMENT ON COLUMN equipements_chauffage.commentaires IS 'Commentaires et observations sur les équipements de chauffage';

-- Create indexes for better performance
CREATE INDEX idx_etat_des_lieux_rendez_vous ON etat_des_lieux(rendez_vous_id);
CREATE INDEX idx_rendez_vous_etat_des_lieux ON rendez_vous(etat_des_lieux_id);
CREATE INDEX idx_rendez_vous_statut ON rendez_vous(statut);
CREATE INDEX idx_rendez_vous_date ON rendez_vous(date);
CREATE INDEX idx_etat_des_lieux_type ON etat_des_lieux(type_etat_des_lieux);
CREATE INDEX idx_etat_des_lieux_statut ON etat_des_lieux(statut);

-- Function to automatically update appointment status when an inventory is created
CREATE OR REPLACE FUNCTION update_rendez_vous_statut()
RETURNS TRIGGER AS $$
BEGIN
    -- Update appointment status when an inventory is created with this appointment_id
    IF NEW.rendez_vous_id IS NOT NULL THEN
        UPDATE rendez_vous 
        SET statut = 'realise',
            etat_des_lieux_id = NEW.id
        WHERE id = NEW.rendez_vous_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automate status updates
CREATE TRIGGER trigger_update_rendez_vous_statut
    AFTER INSERT ON etat_des_lieux
    FOR EACH ROW
    EXECUTE FUNCTION update_rendez_vous_statut();

-- Extension du schéma existant pour supporter multi-utilisateurs et organisations
-- Add user_id to etat_des_lieux and rendez_vous
ALTER TABLE etat_des_lieux ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- RLS (Row Level Security) for Supabase
ALTER TABLE etat_des_lieux ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

-- Policies RLS for etat_des_lieux
CREATE POLICY "Users can manage their own etat_des_lieux" ON etat_des_lieux
    FOR ALL USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can view their own etat_des_lieux" ON etat_des_lieux
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Policies RLS for rendez_vous
CREATE POLICY "Users can manage their own rendez_vous" ON rendez_vous
    FOR ALL USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can view their own rendez_vous" ON rendez_vous
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- First, ensure the auth.users reference exists (this is a Supabase-specific table)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add user_id columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'etat_des_lieux' AND column_name = 'user_id') THEN
        ALTER TABLE etat_des_lieux ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rendez_vous' AND column_name = 'user_id') THEN
        ALTER TABLE rendez_vous ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Add organization_id columns if you want to support multiple organizations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'etat_des_lieux' AND column_name = 'organization_id') THEN
        ALTER TABLE etat_des_lieux ADD COLUMN organization_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rendez_vous' AND column_name = 'organization_id') THEN
        ALTER TABLE rendez_vous ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE etat_des_lieux ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE releve_compteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_energetiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_chauffage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_privatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE autres_equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;

-- Create policies for etat_des_lieux
CREATE POLICY "Enable access to user's own etat_des_lieux" ON etat_des_lieux
    FOR ALL USING (
        auth.uid() = user_id
    );

-- Create policies for rendez_vous
CREATE POLICY "Enable access to user's own rendez_vous" ON rendez_vous
    FOR ALL USING (
        auth.uid() = user_id
    );

-- Create policies for all related tables to ensure users can only access their own data
CREATE POLICY "Enable access to user's own releve_compteurs" ON releve_compteurs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM etat_des_lieux 
            WHERE etat_des_lieux.id = releve_compteurs.etat_des_lieux_id 
            AND etat_des_lieux.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable access to user's own equipements_energetiques" ON equipements_energetiques
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM etat_des_lieux 
            WHERE etat_des_lieux.id = equipements_energetiques.etat_des_lieux_id 
            AND etat_des_lieux.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable access to user's own equipements_chauffage" ON equipements_chauffage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM etat_des_lieux 
            WHERE etat_des_lieux.id = equipements_chauffage.etat_des_lieux_id 
            AND etat_des_lieux.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable access to user's own cles" ON cles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM etat_des_lieux 
            WHERE etat_des_lieux.id = cles.etat_des_lieux_id 
            AND etat_des_lieux.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable access to user's own parties_privatives" ON parties_privatives
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM etat_des_lieux 
            WHERE etat_des_lieux.id = parties_privatives.etat_des_lieux_id 
            AND etat_des_lieux.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable access to user's own autres_equipements" ON autres_equipements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM etat_des_lieux 
            WHERE etat_des_lieux.id = autres_equipements.etat_des_lieux_id 
            AND etat_des_lieux.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable access to user's own pieces" ON pieces
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM etat_des_lieux 
            WHERE etat_des_lieux.id = pieces.etat_des_lieux_id 
            AND etat_des_lieux.user_id = auth.uid()
        )
    );

-- Create a function to automatically set the user_id when a new record is inserted
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id on insert
CREATE TRIGGER set_etat_des_lieux_user_id
BEFORE INSERT ON etat_des_lieux
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_rendez_vous_user_id
BEFORE INSERT ON rendez_vous
FOR EACH ROW
EXECUTE FUNCTION set_user_id();
