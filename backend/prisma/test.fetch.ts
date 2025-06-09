import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EndpointConfig {
    name: string;
    url: string;
    authToken: string;
    fileName: string;
}

const endpoints: EndpointConfig[] = [
    {
        name: 'Bloques Horarios',
        url: 'API_URL_BLOQUES',
        authToken: 'API_TOKEN_BLOQUES',
        fileName: 'bloques_data.json',
    },
    {
        name: 'Demanda Académica',
        url: 'API_URL_DEMANDA', // Más específico para el periodo
        authToken: 'API_TOKEN_DEMANDA',
        fileName: 'demanda_data.json',
    },
    {
        name: 'Semestres (Mallas/Periodos Académicos)',
        url: 'API_URL_SEMESTRES',
        authToken: 'API_TOKEN_SEMESTRES',
        fileName: 'semestres_data.json',
    },
    {
        name: 'Salas',
        url: 'API_URL_SALAS',
        authToken: 'API_TOKEN_SALAS',
        fileName: 'salas_data.json',
    },
    {
        name: 'Profesores',
        url: 'API_URL_PROFESORES', // Más específico para el periodo
        authToken: 'API_TOKEN_PROFESORES',
        fileName: 'profesores_data.json',
    },
];

async function fetchAndSave(endpoint: EndpointConfig) {
    const apiUrl = process.env[endpoint.url];
    const authToken = process.env[endpoint.authToken];

    console.log(`\\nFetching data for ${endpoint.name} from ${endpoint.url}...`);

    if (!apiUrl) {
        console.error(
            `Error: URL de API no configurada para ${endpoint.name}. ` +
            `Asegúrate de que la variable de entorno ${endpoint.url} esté definida en tu archivo .env.`
        );
        return; // No continuar si la URL no está definida
    }

    if (!authToken) {
        console.error(
            `Error: Token de autenticación no encontrado para ${endpoint.name}. ` +
            `Asegúrate de que la variable de entorno ${endpoint.authToken} esté definida en tu archivo .env.`
        );
        return; // No continuar si el token no está definido
    }

    console.log(`  Target URL: ${apiUrl}`); // Log para verificar la URL que se usará

    try {
        const response = await fetch(apiUrl, {
            headers: { 'X-HAWAII-AUTH': authToken },
        });

        if (!response.ok) {
            // Incluir más detalles del error si es posible
            let errorBody = '';
            try {
                errorBody = await response.text();
            } catch (e) {
                // No hacer nada si no se puede leer el cuerpo del error
            }
            throw new Error(
                `HTTP error! status: ${response.status} for ${endpoint.name} (${apiUrl}). Body: ${errorBody}`
            );
        }

        const data = await response.json();
        console.log(`  Datos de ${endpoint.name} recibidos.`);

        const filePath = path.join(__dirname, endpoint.fileName); // Los JSON se guardan en /app/prisma
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`  Datos de ${endpoint.name} guardados en: ${filePath}`);

    } catch (error) {
        console.error(
            `Error fetching o guardando datos de ${endpoint.name} desde ${apiUrl}:`,
            error
        );
    }
}

async function main() {
    console.log('Iniciando la obtención de datos de las APIs desde variables de entorno...');

    let allEnvVarsPresent = true;
    for (const endpoint of endpoints) {
        if (!process.env[endpoint.url]) {
            console.warn(`Advertencia: Variable de entorno para URL '${endpoint.url}' no definida para el endpoint '${endpoint.name}'.`);
            allEnvVarsPresent = false;
        }
        if (!process.env[endpoint.authToken]) {
            console.warn(`Advertencia: Variable de entorno para Token '${endpoint.authToken}' no definida para el endpoint '${endpoint.name}'.`);
            allEnvVarsPresent = false;
        }
    }

    if (!allEnvVarsPresent) {
        console.error("\nAlgunas variables de entorno cruciales no están definidas. Revisa las advertencias anteriores y tu archivo .env.");
        console.log("Proceso de obtención de datos NO se ejecutará completamente debido a configuraciones faltantes.");
        return; // Detener si faltan configuraciones esenciales
    }


    for (const endpoint of endpoints) {
        await fetchAndSave(endpoint);
    }

    console.log(`\nProceso de obtención de datos completado.`);
}

main().catch((error) => {
    console.error('Error general en la ejecución del script principal:', error);
});