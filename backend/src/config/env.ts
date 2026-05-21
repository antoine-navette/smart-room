import { z } from 'zod';

const schema = z.object({
    nodeEnv: z.enum(['development', 'production']),
    allowedOrigins: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.array(z.url())),
    postgresUrl: z.url(),
    smtpUrl: z.url(),
    port: z.coerce.number(),
});

export type Env = z.output<typeof schema>;

export const loadEnv = () => {
    return schema.parse({
        nodeEnv: process.env.NODE_ENV,
        allowedOrigins: process.env.ALLOWED_ORIGINS,
        postgresUrl: process.env.POSTGRES_URL,
        smtpUrl: process.env.SMTP_URL,
        port: process.env.PORT,
    });
};
