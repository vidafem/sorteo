"use client";

import { useState, useEffect, useCallback } from "react";
import FormConcursante from "@/src/components/admin/FormConcursante";
import ListaConcursantes from "@/src/components/admin/ListaConcursantes";
import { getConcursantes, type Concursante } from "@/src/lib/queries";

export default function Admin() {
  const [concursantes, setConcursantes] = useState<Concursante[]>([]);

  const fetchConcursantes = useCallback(async () => {
    const data = await getConcursantes();
    setConcursantes(data);
  }, []);

  useEffect(() => {
  const fetchData = async () => {
    const data = await getConcursantes();
    setConcursantes(data);
  };
  fetchData();
}, []);
  return (
    <div className="p-10">
      <h1 className="text-2xl mb-5">Panel Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <FormConcursante onConcursanteAdded={fetchConcursantes} />
        <ListaConcursantes concursantes={concursantes} />
      </div>
    </div>
  );
}