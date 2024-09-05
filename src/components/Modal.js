"use client";

import React from "react";

function Modal({ onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50"
      ></div>
      <div className="fixed inset-0 z-20 m-auto h-fit max-h-[95vh] w-1/2 overflow-auto rounded-xl bg-white shadow-lg">
        {children}
      </div>
    </>
  );
}

export default Modal;
