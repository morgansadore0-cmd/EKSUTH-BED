import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { Ward, Bed, BedStatus, BedType, GenderCompatibility } from '../types';
import { toast } from 'react-toastify';

const INITIAL_WARDS = [
  { code: 'EMR', name: 'Emergency Ward', capacity: 30, type: 'Emergency', floor: '1' },
  { code: 'MED-A', name: 'Medical Ward A', capacity: 35, type: 'Medical', floor: '2' },
  { code: 'MED-B', name: 'Medical Ward B', capacity: 35, type: 'Medical', floor: '2' },
  { code: 'SUR-A', name: 'Surgical Ward A', capacity: 30, type: 'Surgical', floor: '3' },
  { code: 'SUR-B', name: 'Surgical Ward B', capacity: 30, type: 'Surgical', floor: '3' },
  { code: 'OBG', name: 'Obstetrics & Gynaecology', capacity: 30, type: 'Maternity', floor: '4' },
  { code: 'PAED', name: 'Paediatrics', capacity: 25, type: 'Paediatric', floor: '4' },
  { code: 'ORTHO', name: 'Orthopaedics', capacity: 25, type: 'Orthopaedic', floor: '5' },
  { code: 'PRIV', name: 'Private Ward', capacity: 20, type: 'Private', floor: '5' },
  { code: 'ICU', name: 'Intensive Care Unit', capacity: 20, type: 'ICU', floor: '6' },
];

const DEMO_STAFF = [
  { staffId: 'EKSUTH-SADM-2026-001', role: 'SUPER_ADMIN', name: 'Demo Super Admin' },
  { staffId: 'EKSUTH-ADM-2026-001', role: 'ADMIN', name: 'Demo Admin' },
  { staffId: 'EKSUTH-BM-2026-001', role: 'BED_MANAGER', name: 'Demo Bed Manager' },
  { staffId: 'EKSUTH-DOC-2026-001', role: 'DOCTOR', name: 'Demo Doctor' },
  { staffId: 'EKSUTH-NUR-2026-001', role: 'NURSE', name: 'Demo Nurse' },
  { staffId: 'EKSUTH-AO-2026-001', role: 'ADMISSION_OFFICER', name: 'Demo Admission Officer' },
  { staffId: 'EKSUTH-VWR-2026-001', role: 'VIEWER', name: 'Demo Viewer' },
];

export const seedDatabase = async () => {
  try {
    const wardsSnapshot = await getDocs(collection(db, getCollectionName('wards')));
    if (!wardsSnapshot.empty) {
      toast.info('Database already seeded. Wards exist.');
      return;
    }

    const batch = writeBatch(db);
    const now = Date.now();

    let totalBedsCreated = 0;

    for (const wardData of INITIAL_WARDS) {
      const wardRef = doc(collection(db, getCollectionName('wards')));
      const ward: Ward = {
        id: wardRef.id,
        name: wardData.name,
        code: wardData.code,
        capacity: wardData.capacity,
        floor: (wardData as any).floor || 'Unknown',
        type: wardData.type,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(wardRef, ward);

      // Create beds for this ward
      for (let i = 1; i <= wardData.capacity; i++) {
        const bedRef = doc(collection(db, getCollectionName('beds')));
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

    // Seed Demo Staff Registry
    const staffRegistrySnapshot = await getDocs(collection(db, getCollectionName('staffRegistry')));
    if (staffRegistrySnapshot.empty) {
      for (const staffData of DEMO_STAFF) {
        const staffRef = doc(db, getCollectionName('staffRegistry'), staffData.staffId);
        batch.set(staffRef, {
          staffId: staffData.staffId,
          fullName: staffData.name,
          email: `${staffData.staffId.toLowerCase()}@eksuth.demo`,
          phone: '08000000000',
          department: 'Demo',
          role: staffData.role,
          status: 'AVAILABLE',
          linkedUserId: null,
          createdBy: 'system',
          createdAt: now,
          updatedAt: now
        });
      }
    }

    await batch.commit();
    toast.success(`Successfully seeded database with wards, beds, and demo staff.`);
  } catch (error) {
    console.error('Error seeding database:', error);
    toast.error('Failed to seed database.');
  }
};
