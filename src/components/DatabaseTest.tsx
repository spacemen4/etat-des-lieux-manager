import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Adjusted path

interface EtatDesLieux {
  id: string;
  adresse_bien: string;
  date_entree: string | null;
  // Add other fields as necessary for display
}

function DatabaseTest() {
  const [data, setData] = useState<EtatDesLieux[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: edlData, error: edlError } = await supabase
        .from('etat_des_lieux')
        .select('id, adresse_bien, date_entree')
        .limit(5);

      if (edlError) {
        console.error('Error fetching data:', edlError);
        setError(`Error fetching data: ${edlError.message}. Details: ${edlError.details}. Hint: ${edlError.hint}`);
      } else {
        setData(edlData);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <p>Loading test data from 'etat_des_lieux'...</p>;
  }

  if (error) {
    return (
      <div>
        <p>Error loading data:</p>
        <pre style={{ color: 'red', backgroundColor: '#fdd', padding: '10px', whiteSpace: 'pre-wrap' }}>
          {error}
        </pre>
        <p>
          <strong>Troubleshooting Tips:</strong>
          <ul>
            <li>Ensure your <code>.env</code> file is correctly set up with <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
            <li>Verify that the DDL script has been run successfully in your Supabase SQL Editor and the <code>etat_des_lieux</code> table exists.</li>
            <li>Check your browser's developer console for network errors or more detailed Supabase client errors.</li>
            <li>Confirm Row Level Security (RLS) policies on the <code>etat_des_lieux</code> table in Supabase allow read access for the 'anon' role if you haven't set up user authentication yet for this test.</li>
          </ul>
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p>No data found in 'etat_des_lieux' table, or table is empty. This is okay if you haven't added any records yet after running the DDL.</p>;
  }

  return (
    <div>
      <h2>Database Test: etat_des_lieux (First 5 records)</h2>
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            <strong>ID:</strong> {item.id}, <strong>Address:</strong> {item.adresse_bien}, <strong>Entry Date:</strong> {item.date_entree || 'N/A'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DatabaseTest;
