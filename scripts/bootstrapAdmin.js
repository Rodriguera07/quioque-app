// Script único, rodado localmente por você, para criar a primeira
// organização e o primeiro usuário admin — depois disso, todo o resto de
// usuários é cadastrado pelo próprio app (tela "Gerenciar Usuários").
//
// Como usar:
//   1. No Console do Firebase: Configurações do projeto > Contas de serviço
//      > "Gerar nova chave privada". Salve o JSON baixado como
//      scripts/serviceAccountKey.json (já está no .gitignore).
//   2. cd scripts && npm install (só na primeira vez)
//   3. node bootstrapAdmin.js "Nome do Quiosque" admin@seudominio.com "SenhaForte123" "Seu Nome"
//
// O script é seguro para rodar mais de uma vez com o mesmo e-mail: ele avisa
// e não duplica nada se o usuário já existir.

const admin = require('firebase-admin');
const path = require('path');

const [, , orgName, email, password, displayName] = process.argv;

if (!orgName || !email || !password || !displayName) {
  console.error(
    'Uso: node bootstrapAdmin.js "Nome do Quiosque" admin@seudominio.com "SenhaForte123" "Seu Nome"'
  );
  process.exit(1);
}
if (password.length < 6) {
  console.error('A senha precisa ter ao menos 6 caracteres.');
  process.exit(1);
}

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error(
    `Não encontrei ${serviceAccountPath}.\n` +
      'Baixe a chave de conta de serviço no Console do Firebase (Configurações do projeto > Contas de serviço) e salve nesse caminho.'
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
  const auth = admin.auth();
  const db = admin.firestore();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`Usuário ${email} já existe no Auth (uid ${userRecord.uid}), reaproveitando.`);
  } catch {
    userRecord = await auth.createUser({ email, password, displayName });
    console.log(`Usuário criado no Auth: ${userRecord.uid}`);
  }

  const orgRef = db.collection('organizations').doc();
  const nowIso = new Date().toISOString();

  const batch = db.batch();
  batch.set(orgRef, { name: orgName, ownerId: userRecord.uid, createdAt: nowIso });
  batch.set(db.doc(`users/${userRecord.uid}`), { orgId: orgRef.id, role: 'admin' });
  batch.set(db.doc(`organizations/${orgRef.id}/users/${userRecord.uid}`), {
    uid: userRecord.uid,
    orgId: orgRef.id,
    email,
    displayName,
    role: 'admin',
    active: true,
    createdAt: nowIso,
    createdBy: userRecord.uid,
  });
  await batch.commit();

  console.log('\nTudo pronto!');
  console.log(`Organização: ${orgName} (${orgRef.id})`);
  console.log(`Admin: ${displayName} <${email}>`);
  console.log('\nJá pode fazer login no app com esse e-mail e senha.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Falha ao rodar o bootstrap:', err);
    process.exit(1);
  });
