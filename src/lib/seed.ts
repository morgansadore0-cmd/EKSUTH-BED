import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Ward, Bed, BedStatus, BedType, GenderCompatibility } from '../types';
import { toast } from 'react-toastify';

const INITIAL_WARDS = [
  { code: 'EMR', name: 'Emergency Ward', capacity: 30, type: 'Emergency' },
  { code: 'MED-A', name: 'Medical Ward A', capacity: 35, type: 'Medical' },
  { code: 'MED-B', name: 'Medical Ward B', capacity: 35, type: 'Medical' },
  { code: 'SUR-A', name: 'Surgical Ward A', capacity: 30, type: 'Surgical' },
  { code: 'SUR-B', name: 'Surgical Ward B', capacity: 30, type: 'Surgical' },
  { code: 'OBG', name: 'Obstetrics & Gynaecology', capacity: 30, type: 'Maternity' },
  { code: 'PAED', name: 'Paediatrics', capacity: 25, type: 'Paediatric' },
  { code: 'ORTHO', name: 'Orthopaedics', capacity: 25, type: 'Orthopaedic' },
  { code: 'PRIV', name: 'Private Ward', capacity: 20, type: 'Private' },
  { code: 'ICU', name: 'Intensive Care Unit', capacity: 20, type: 'ICU' },
];

export const seedDatabase = async () => {
  try {
    const wardsSnapshot = await getDocs(collection(db, 'wards'));
    if (!wardsSnapshot.empty) {
      toast.info('Database already seeded. Wards exist.');
      return;
    }

    const batch = writeBatch(db);
    const now = Date.now();

    let totalBedsCreated = 0;

    for (const wardData of INITIAL_WARDS) {
      const wardRef = doc(collection(db, 'wards'));
      const ward: Ward = {
        id: wardRef.id,
        name: wardData.name,
        code: wardData.code,
        capacity: wardData.capacity,
        type: wardData.type,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(wardRef, ward);

      // Create beds for this ward
      for (let i = 1; i <= wardData.capacity; i++) {
        const bedRef = doc(collection(db, 'beds'));
        const bedNumStr = i.toString().padStart(2, '0');
        
        let type: BedType = 'Standard';
        let genderComp: GenderCompatibility = 'ANY';

        if (wardData.code === 'ICU') type = 'ICU';
        if (wardData.code === 'OBG') {
          type = 'Maternity';
          genderComp = 'FEMALE';
        }
        if (wardData.code === 'PAED') type = 'Paediatric';
        
        // Randomize initial status slightly for realism (mostly available)
        const rand = Math.random();
        let status: BedStatus = 'AVAILABLE';
        if (rand < 0.1) status = 'OCCUPIED';
        else if (rand < 0.15) status = 'RESERVED';
        else if (rand < 0.18) status = 'CLEANING';
        else if (rand < 0.20) status = 'MAINTENANCE';

        const bed: Bed = {
          id: bedRef.id,
          bedNumber: `${wardData.code}-${bedNumStr}`,
          wardId: wardRef.id,
          type,
          status,
          genderCompatibility: genderComp,
          currentPatientId: null,
          createdAt: now,
          updatedAt: now,
        };
        batch.set(bedRef, bed);
        totalBedsCreated++;
      }
    }

    await batch.commit();
    toast.success(`Successfully seeded ${INITIAL_WARDS.length} wards and ${totalBedsCreated} beds.`);
  } catch (error) {
    console.error('Error seeding database:', error);
    toast.error('Failed to seed database.');
  }
};
