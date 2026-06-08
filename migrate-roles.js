import mongoose from 'mongoose';

const URI = 'mongodb+srv://projectitpteam_db_user:tH8F6ZR6mptC145i@cluster0.99cf4gg.mongodb.net/service_pal?appName=Cluster0';

mongoose.connect(URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({ role: String }, { strict: false });
const User = mongoose.model('User', UserSchema);

async function run() {
  const buyerRes = await User.updateMany({ role: 'buyer' }, { $set: { role: 'customer' } });
  console.log('Migrated buyer -> customer:', buyerRes.modifiedCount);

  const sellerRes = await User.updateMany({ role: 'seller' }, { $set: { role: 'provider' } });
  console.log('Migrated seller -> provider:', sellerRes.modifiedCount);

  const superAdminRes = await User.updateMany({ role: 'superadmin' }, { $set: { role: 'super_admin' } });
  console.log('Migrated superadmin -> super_admin:', superAdminRes.modifiedCount);

  mongoose.disconnect();
}

run().catch(console.dir);
