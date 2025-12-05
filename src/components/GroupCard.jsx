import React from "react";

const GroupCard = ({ group }) => {
  return (
    <div className="border p-4 rounded shadow hover:shadow-lg transition">
      <h2 className="font-bold text-lg">{group.name}</h2>
      <p>Matière : {group.subject}</p>
      <p>Niveau : {group.level}</p>
      <p>Membres : {group.members?.length || 0}</p>
    </div>
  );
};

export default GroupCard;
