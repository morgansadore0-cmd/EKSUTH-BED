const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Update departmentStats calculation to include the list of available bed numbers
code = code.replace(
  "return { name: ward.name, type: ward.type, available, occupied, total, rate };",
  "const availableBedNumbers = wardBeds.filter(b => b.status === 'AVAILABLE').sort((a, b) => a.bedNumber.localeCompare(b.bedNumber, undefined, {numeric: true})).map(b => b.bedNumber);\n    return { name: ward.name, type: ward.type, available, occupied, total, rate, availableBedNumbers };"
);

// Update table to show bed numbers
const cellReplacement = `
                      <td className="px-6 py-4 text-left">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={clsx("inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium", dept.available > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                            {dept.available} Available
                          </span>
                          {dept.available > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                              {dept.availableBedNumbers.slice(0, 10).map((num, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200">{num}</span>
                              ))}
                              {dept.availableBedNumbers.length > 10 && (
                                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium border border-gray-200">+{dept.availableBedNumbers.length - 10} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
`;

code = code.replace(
  /<td className="px-6 py-4 text-right">[\s\S]*?<\/td>/m,
  cellReplacement.trim()
);

// Align the header for Available Beds to the left
code = code.replace(
  '<th className="px-6 py-3 text-right">Available Beds</th>',
  '<th className="px-6 py-3 text-left">Available Beds</th>'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
