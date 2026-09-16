const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

const targetHTML = `<span className="text-[10px] text-slate-500">{patient.phone}</span>
                      </div>`;

const replacementHTML = `<span className="text-[10px] text-slate-500">{patient.phone}</span>
                        {patient.diagnosis && (
                          <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={patient.diagnosis}>
                            Dx: {patient.diagnosis}
                          </span>
                        )}
                      </div>`;

code = code.replace(targetHTML, replacementHTML);

fs.writeFileSync('src/pages/Patients.tsx', code);
