const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

// Undo the bad placement
code = code.replace(
`          <p className="text-sm text-gray-500 mt-1">Register and view patient records</p>
          {transferringPatient && (
        <QuickTransferModal 
          patient={transferringPatient} 
          onClose={() => setTransferringPatient(null)} 
        />
      )}
    </div>`,
`          <p className="text-sm text-gray-500 mt-1">Register and view patient records</p>
        </div>`
);

// Place at the very end
code = code.replace(
  "      )}\n    </div>\n  );\n}",
  "      )}\n      {transferringPatient && (\n        <QuickTransferModal \n          patient={transferringPatient} \n          onClose={() => setTransferringPatient(null)} \n        />\n      )}\n    </div>\n  );\n}"
);

fs.writeFileSync('src/pages/Patients.tsx', code);
