import React from 'react';
import { useParams } from 'react-router-dom';
import ExpenseForm from './ExpenseForm'; 

const ExpensePage = () => {
  const { groupId } = useParams();

  const mode = groupId ? 'group' : 'personal';

  return <ExpenseForm mode={mode} groupId={groupId} />;
};

export default ExpensePage;