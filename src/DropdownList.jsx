import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField } from '@mui/material';

const DropdownList = () => {
  // Define the list of strings
  const options = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

  // Initialize state for selectedOption
  const [selectedOption, setSelectedOption] = useState('');

  // UseEffect to load previously saved selections from localStorage
  useEffect(() => {
    const savedSelections =
      JSON.parse(localStorage.getItem('selectedFruits')) || [];
    // You can choose to pre-select an option if you want to show the last selected one
    if (savedSelections.length > 0) {
      setSelectedOption(savedSelections[savedSelections.length - 1]); // Display last selected value
    }
  }, []);

  const handleChange = (event) => {
    const newSelection = event.target.value;

    // Save the new selection to localStorage
    const savedSelections =
      JSON.parse(localStorage.getItem('selectedFruits')) || [];
    savedSelections.push(newSelection);

    // Update the state
    setSelectedOption(newSelection);

    // Save the updated array of selections to localStorage
    localStorage.setItem('selectedFruits', JSON.stringify(savedSelections));
  };

  return (
    <Autocomplete
      value={selectedOption}
      onChange={handleChange}
      options={options}
      renderInput={(params) => (
        <TextField {...params} label='Receiver address' variant='outlined' />
      )}
      freeSolo // Allows typing any value (even if it's not part of the options)
    />
  );
};

export default DropdownList;
