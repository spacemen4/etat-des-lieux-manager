-- RLS policies for releve_compteurs
ALTER TABLE public.releve_compteurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own releve_compteurs"
ON public.releve_compteurs
FOR ALL
USING (auth.uid() = (SELECT user_id FROM public.etat_des_lieux WHERE id = etat_des_lieux_id));

-- RLS policies for equipements_energetiques
ALTER TABLE public.equipements_energetiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own equipements_energetiques"
ON public.equipements_energetiques
FOR ALL
USING (auth.uid() = (SELECT user_id FROM public.etat_des_lieux WHERE id = etat_des_lieux_id));

-- RLS for photos bucket
CREATE POLICY "Allow users to upload photos to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'etat-des-lieux-photos'
  AND (storage.foldername(name))[1] = (SELECT l.user_id::text FROM public.etat_des_lieux l WHERE l.id::text = (storage.foldername(name))[2])
);

CREATE POLICY "Allow users to view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'etat-des-lieux-photos'
  AND (storage.foldername(name))[1] = (SELECT l.user_id::text FROM public.etat_des_lieux l WHERE l.id::text = (storage.foldername(name))[2])
);

CREATE POLICY "Allow users to delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'etat-des-lieux-photos'
  AND (storage.foldername(name))[1] = (SELECT l.user_id::text FROM public.etat_des_lieux l WHERE l.id::text = (storage.foldername(name))[2])
);
