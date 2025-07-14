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
-- Compatible avec Supabase et authentification intégrée

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: organisations
-- Gère les entreprises/organisations qui peuvent avoir plusieurs utilisateurs
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    siret TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    active BOOLEAN DEFAULT TRUE
);

-- Table: utilisateurs (profils utilisateurs)
-- Étend les informations d'authentification Supabase
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    telephone TEXT,
    organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'utilisateur' CHECK (role IN ('super_admin', 'admin_organisation', 'utilisateur')),
    statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'en_attente')),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ,
    -- Métadonnées pour la gestion
    created_by UUID REFERENCES utilisateurs(id),
    activated_by UUID REFERENCES utilisateurs(id),
    activated_at TIMESTAMPTZ
);

-- Table: invitations
-- Gère les invitations d'utilisateurs dans une organisation
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'utilisateur' CHECK (role IN ('admin_organisation', 'utilisateur')),
    invite_par UUID NOT NULL REFERENCES utilisateurs(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'expire', 'revoque'))
);

-- Table: permissions_partage
-- Gère les permissions de partage entre utilisateurs
CREATE TABLE permissions_partage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    etat_des_lieux_id UUID NOT NULL REFERENCES etat_des_lieux(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    permission TEXT NOT NULL CHECK (permission IN ('lecture', 'ecriture', 'admin')),
    accorde_par UUID NOT NULL REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    UNIQUE(etat_des_lieux_id, utilisateur_id)
);

-- Modification de la table etat_des_lieux existante
-- Ajout des colonnes pour multi-utilisateurs
ALTER TABLE etat_des_lieux ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id);
ALTER TABLE etat_des_lieux ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id);
ALTER TABLE etat_des_lieux ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE etat_des_lieux ADD COLUMN IF NOT EXISTS visibilite TEXT DEFAULT 'prive' CHECK (visibilite IN ('prive', 'organisation', 'public'));
ALTER TABLE etat_des_lieux ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE etat_des_lieux ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Modification de la table rendez_vous existante
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id);
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id);
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Table: audit_log
-- Traçabilité des actions importantes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    utilisateur_id UUID REFERENCES utilisateurs(id),
    organisation_id UUID REFERENCES organisations(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes pour les performances
CREATE INDEX idx_utilisateurs_organisation ON utilisateurs(organisation_id);
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_statut ON utilisateurs(statut);
CREATE INDEX idx_etat_des_lieux_created_by ON etat_des_lieux(created_by);
CREATE INDEX idx_etat_des_lieux_organisation ON etat_des_lieux(organisation_id);
CREATE INDEX idx_etat_des_lieux_visibilite ON etat_des_lieux(visibilite);
CREATE INDEX idx_rendez_vous_created_by ON rendez_vous(created_by);
CREATE INDEX idx_rendez_vous_organisation ON rendez_vous(organisation_id);
CREATE INDEX idx_permissions_partage_user ON permissions_partage(utilisateur_id);
CREATE INDEX idx_permissions_partage_etat ON permissions_partage(etat_des_lieux_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_audit_log_user ON audit_log(utilisateur_id);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Fonction pour gérer les timestamps automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER trigger_utilisateurs_updated_at
    BEFORE UPDATE ON utilisateurs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_organisations_updated_at
    BEFORE UPDATE ON organisations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_etat_des_lieux_updated_at
    BEFORE UPDATE ON etat_des_lieux
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rendez_vous_updated_at
    BEFORE UPDATE ON rendez_vous
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour l'audit automatique
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, utilisateur_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), 
                COALESCE(current_setting('app.current_user_id', true)::uuid, null));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, utilisateur_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::uuid, null));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, utilisateur_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::uuid, null));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers d'audit pour les tables principales
CREATE TRIGGER audit_etat_des_lieux
    AFTER INSERT OR UPDATE OR DELETE ON etat_des_lieux
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_utilisateurs
    AFTER INSERT OR UPDATE OR DELETE ON utilisateurs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_organisations
    AFTER INSERT OR UPDATE OR DELETE ON organisations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Fonction pour vérifier les permissions
CREATE OR REPLACE FUNCTION check_etat_lieux_permission(
    p_etat_des_lieux_id UUID,
    p_utilisateur_id UUID,
    p_permission TEXT DEFAULT 'lecture'
) RETURNS BOOLEAN AS $$
DECLARE
    v_etat_record RECORD;
    v_user_record RECORD;
    v_permission_exists BOOLEAN := FALSE;
BEGIN
    -- Récupérer les infos de l'état des lieux
    SELECT * INTO v_etat_record 
    FROM etat_des_lieux 
    WHERE id = p_etat_des_lieux_id;
    
    -- Récupérer les infos utilisateur
    SELECT * INTO v_user_record 
    FROM utilisateurs 
    WHERE id = p_utilisateur_id;
    
    -- Super admin a tous les droits
    IF v_user_record.role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Propriétaire a tous les droits
    IF v_etat_record.created_by = p_utilisateur_id THEN
        RETURN TRUE;
    END IF;
    
    -- Admin organisation a tous les droits sur les documents de son organisation
    IF v_user_record.role = 'admin_organisation' 
       AND v_user_record.organisation_id = v_etat_record.organisation_id THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier visibilité organisation
    IF v_etat_record.visibilite = 'organisation' 
       AND v_user_record.organisation_id = v_etat_record.organisation_id THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier permissions explicites
    SELECT EXISTS(
        SELECT 1 FROM permissions_partage 
        WHERE etat_des_lieux_id = p_etat_des_lieux_id 
        AND utilisateur_id = p_utilisateur_id
        AND (expires_at IS NULL OR expires_at > now())
        AND (
            permission = 'admin' OR 
            (p_permission = 'lecture' AND permission IN ('lecture', 'ecriture', 'admin')) OR
            (p_permission = 'ecriture' AND permission IN ('ecriture', 'admin'))
        )
    ) INTO v_permission_exists;
    
    RETURN v_permission_exists;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) pour Supabase
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE etat_des_lieux ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions_partage ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour utilisateurs
CREATE POLICY "Users can view their own profile" ON utilisateurs
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON utilisateurs
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can manage org users" ON utilisateurs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM utilisateurs u 
            WHERE u.id = auth.uid() 
            AND (u.role = 'super_admin' OR 
                 (u.role = 'admin_organisation' AND u.organisation_id = utilisateurs.organisation_id))
        )
    );

-- Politiques RLS pour organisations
CREATE POLICY "Users can view their organization" ON organisations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM utilisateurs u 
            WHERE u.id = auth.uid() 
            AND u.organisation_id = organisations.id
        )
    );

CREATE POLICY "Admin can manage organizations" ON organisations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM utilisateurs u 
            WHERE u.id = auth.uid() 
            AND (u.role = 'super_admin' OR 
                 (u.role = 'admin_organisation' AND u.organisation_id = organisations.id))
        )
    );

-- Politiques RLS pour etat_des_lieux
CREATE POLICY "Users can manage their own etat_des_lieux" ON etat_des_lieux
    FOR ALL USING (
        check_etat_lieux_permission(id, auth.uid(), 'ecriture')
    );

CREATE POLICY "Users can view accessible etat_des_lieux" ON etat_des_lieux
    FOR SELECT USING (
        check_etat_lieux_permission(id, auth.uid(), 'lecture')
    );

-- Politiques similaires pour les autres tables...
CREATE POLICY "Users can manage their rendez_vous" ON rendez_vous
    FOR ALL USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM utilisateurs u 
            WHERE u.id = auth.uid() 
            AND (u.role = 'super_admin' OR 
                 (u.role = 'admin_organisation' AND u.organisation_id = rendez_vous.organisation_id))
        )
    );

-- Fonction pour créer une nouvelle organisation avec admin
CREATE OR REPLACE FUNCTION create_organisation_with_admin(
    p_nom_organisation TEXT,
    p_adresse_organisation TEXT,
    p_email_admin TEXT,
    p_prenom_admin TEXT,
    p_nom_admin TEXT,
    p_telephone_admin TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_organisation_id UUID;
    v_admin_id UUID;
BEGIN
    -- Créer l'organisation
    INSERT INTO organisations (nom, adresse, email)
    VALUES (p_nom_organisation, p_adresse_organisation, p_email_admin)
    RETURNING id INTO v_organisation_id;
    
    -- Créer le profil admin (l'utilisateur doit déjà exister dans auth.users)
    INSERT INTO utilisateurs (id, email, prenom, nom, telephone, organisation_id, role, statut)
    VALUES (
        auth.uid(), 
        p_email_admin, 
        p_prenom_admin, 
        p_nom_admin, 
        p_telephone_admin, 
        v_organisation_id, 
        'admin_organisation', 
        'actif'
    )
    RETURNING id INTO v_admin_id;
    
    RETURN v_organisation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour inviter un utilisateur
CREATE OR REPLACE FUNCTION invite_user_to_organisation(
    p_organisation_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'utilisateur'
) RETURNS UUID AS $$
DECLARE
    v_invitation_id UUID;
    v_token TEXT;
    v_inviter_id UUID := auth.uid();
BEGIN
    -- Vérifier que l'inviteur a les droits
    IF NOT EXISTS (
        SELECT 1 FROM utilisateurs 
        WHERE id = v_inviter_id 
        AND organisation_id = p_organisation_id 
        AND role IN ('admin_organisation', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to invite users';
    END IF;
    
    -- Générer un token unique
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Créer l'invitation
    INSERT INTO invitations (organisation_id, email, role, invite_par, token, expires_at)
    VALUES (
        p_organisation_id, 
        p_email, 
        p_role, 
        v_inviter_id, 
        v_token, 
        now() + interval '7 days'
    )
    RETURNING id INTO v_invitation_id;
    
    RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vues utiles pour l'application
CREATE OR REPLACE VIEW v_etat_des_lieux_with_permissions AS
SELECT 
    e.*,
    u.prenom || ' ' || u.nom as created_by_name,
    o.nom as organisation_name,
    CASE 
        WHEN e.created_by = auth.uid() THEN 'owner'
        WHEN EXISTS (
            SELECT 1 FROM permissions_partage p 
            WHERE p.etat_des_lieux_id = e.id 
            AND p.utilisateur_id = auth.uid()
            AND p.permission = 'admin'
        ) THEN 'admin'
        WHEN EXISTS (
            SELECT 1 FROM permissions_partage p 
            WHERE p.etat_des_lieux_id = e.id 
            AND p.utilisateur_id = auth.uid()
            AND p.permission = 'ecriture'
        ) THEN 'write'
        ELSE 'read'
    END as user_permission
FROM etat_des_lieux e
LEFT JOIN utilisateurs u ON e.created_by = u.id
LEFT JOIN organisations o ON e.organisation_id = o.id
WHERE check_etat_lieux_permission(e.id, auth.uid(), 'lecture');

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN etat_des_lieux.created_by IS 'Utilisateur qui a créé cet état des lieux';
COMMENT ON COLUMN etat_des_lieux.organisation_id IS 'Organisation propriétaire de cet état des lieux';
COMMENT ON COLUMN etat_des_lieux.visibilite IS 'Niveau de visibilité: prive, organisation, public';
COMMENT ON COLUMN utilisateurs.role IS 'Rôle: super_admin, admin_organisation, utilisateur';
COMMENT ON COLUMN utilisateurs.statut IS 'Statut: actif, inactif, en_attente';
COMMENT ON TABLE permissions_partage IS 'Gère les permissions de partage entre utilisateurs';
COMMENT ON TABLE invitations IS 'Gère les invitations d''utilisateurs dans les organisations';
COMMENT ON TABLE audit_log IS 'Journal d''audit pour tracer les actions importantes';