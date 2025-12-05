import React from "react";

const UserCard = ({ user }) => {
  return (
    <div className="border p-3 rounded shadow hover:shadow-md transition">
      <h3 className="font-semibold">{user.name}</h3>
      <p>Compétences : {user.skills.join(", ")}</p>
      <p>Disponibilité : {user.availability}</p>
    </div>
  );
};

export default UserCard;
