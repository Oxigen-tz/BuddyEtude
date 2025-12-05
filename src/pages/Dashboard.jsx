import React, { useEffect, useState } from "react";
import GroupCard from "../components/GroupCard";
import { getGroups } from "../firebase/services";

const Dashboard = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const data = await getGroups();
      setGroups(data);
    };
    fetchGroups();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mes Groupes BuddyEtude</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => <GroupCard key={group.id} group={group} />)}
      </div>
    </div>
  );
};

export default Dashboard;
