"use client";

import { useState } from "react";

export function useDateFilter() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
  };
}
