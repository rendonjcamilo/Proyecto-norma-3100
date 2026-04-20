import colombiaData from '@/data/colombia.json';

interface Department {
  id: string;
  name: string;
  municipalities: string[];
}

export function useColombiaData() {
  const departments: Department[] = colombiaData.departments;

  const getDepartmentNames = (): string[] => {
    return departments.map((dept) => dept.name);
  };

  const getMunicipalitiesByDepartment = (departmentName: string): string[] => {
    const department = departments.find((dept) => dept.name === departmentName);
    return department?.municipalities || [];
  };

  return {
    departments,
    getDepartmentNames,
    getMunicipalitiesByDepartment,
  };
}
