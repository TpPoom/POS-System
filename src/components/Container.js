import React from "react";

function Container({ children }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}

export default Container;
