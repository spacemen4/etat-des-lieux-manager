import React from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./Index";
import EtatSortie from "./EtatSortie";
import NotFound from "./NotFound";
import NewEtatDesLieux from "./NewEtatDesLieux";
import MonCalendrierPage from "./MonCalendrier";

const Home = () => {
    return (
        <Routes>
            <Route index element={<Index />} />
            <Route path="new-etat-des-lieux" element={<NewEtatDesLieux />} />
            <Route path="sortie/:id" element={<EtatSortie />} />
            <Route path="mon-calendrier" element={<MonCalendrierPage />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default Home;
