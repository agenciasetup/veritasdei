export interface TrailStep {
  label: string
  description: string
  content: string
}

export interface Trail {
  id: string
  title: string
  subtitle: string
  description: string
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado'
  color: string
  iconName: string
  steps: TrailStep[]
}

export const TRAILS_1: Trail[] = [
  {
    id: 'iniciante',
    title: 'Católico Iniciante',
    subtitle: 'O essencial da fé',
    description: 'Para quem está começando a conhecer a Igreja Católica.',
    difficulty: 'Iniciante',
    color: '#C9A84C',
    iconName: 'GraduationCap',
    steps: [
      {
        label: 'Os Dez Mandamentos',
        description: 'A lei moral que Deus nos deu',
        content: '1. Amar a Deus sobre todas as coisas\n2. Não tomar Seu Santo Nome em vão\n3. Guardar domingos e festas de guarda\n4. Honrar pai e mãe\n5. Não matar\n6. Não pecar contra a castidade\n7. Não furtar\n8. Não levantar falso testemunho\n9. Não desejar a mulher do próximo\n10. Não cobiçar as coisas alheias\n\nOs Mandamentos foram dados por Deus a Moisés no Monte Sinai e resumem toda a lei moral. Jesus os confirmou e aprofundou no Sermão da Montanha.'
      },
      {
        label: 'Os Preceitos da Igreja',
        description: 'O mínimo que a Igreja pede',
        content: '1. Participar da Missa aos domingos e festas de guarda\n2. Confessar-se ao menos uma vez por ano\n3. Comungar ao menos na Páscoa\n4. Jejuar e abster-se de carne nos dias determinados\n5. Contribuir para as necessidades da Igreja\n\nEstes cinco preceitos representam o mínimo indispensável de oração e vida moral para todo católico.'
      },
      {
        label: 'Orações Fundamentais',
        description: 'As preces que todo católico deve saber',
        content: 'PAI NOSSO\nPai nosso que estais nos céus, santificado seja o vosso nome, venha a nós o vosso reino, seja feita a vossa vontade assim na terra como no céu. O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.\n\nAVE MARIA\nAve Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora da nossa morte. Amém.\n\nGLÓRIA AO PAI\nGlória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.'
      },
      {
        label: 'Os Sete Sacramentos',
        description: 'Os sinais visíveis da graça de Deus',
        content: '1. Batismo — Porta de entrada na Igreja, apaga o pecado original.\n2. Confirmação (Crisma) — Fortalece a graça do Batismo pelo Espírito Santo.\n3. Eucaristia — Corpo e Sangue de Cristo sob as aparências de pão e vinho.\n4. Penitência (Confissão) — Perdão dos pecados cometidos após o Batismo.\n5. Unção dos Enfermos — Conforto e graça aos doentes graves.\n6. Ordem — Consagra diáconos, padres e bispos para o serviço da Igreja.\n7. Matrimônio — Une homem e mulher num vínculo sagrado e indissolúvel.'
      },
    ],
  },
  {
    id: 'sacramental',
    title: 'Vida Sacramental',
    subtitle: 'Os canais da graça',
    description: 'Mergulhe nos 7 Sacramentos: o que são, como funcionam, o que significam.',
    difficulty: 'Intermediário',
    color: '#8B3145',
    iconName: 'Droplets',
    steps: [
      {
        label: 'Os 7 Sacramentos em Detalhe',
        description: 'Visão geral dos sinais da graça',
        content: 'Os Sacramentos são sinais sensíveis instituídos por Cristo para dar graça. São sete e dividem-se em três grupos:\n\nSacramentos de Iniciação: Batismo, Confirmação e Eucaristia — introduzem o fiel na vida cristã.\n\nSacramentos de Cura: Penitência e Unção dos Enfermos — restauram a alma ferida pelo pecado e pela doença.\n\nSacramentos de Serviço: Ordem e Matrimônio — consagram para a missão na Igreja e na família.'
      },
      {
        label: 'Virtudes Teologais',
        description: 'Fé, Esperança e Caridade',
        content: 'As três virtudes teologais são infundidas por Deus na alma:\n\nFÉ — Crer em Deus e em tudo o que Ele revelou. "A fé é o fundamento da esperança" (Hb 11,1).\n\nESPERANÇA — Confiar que Deus nos dará a vida eterna e os meios para alcançá-la. "Esperança que não decepciona" (Rm 5,5).\n\nCARIDADE — Amar a Deus sobre todas as coisas e ao próximo como a si mesmo. "O maior destes é a caridade" (1Cor 13,13).\n\nEstas virtudes orientam toda a vida moral do cristão e são a base da santidade.'
      },
      {
        label: 'Os Sete Pecados Capitais',
        description: 'Conhecer o inimigo interior',
        content: 'Os pecados capitais são inclinações que geram outros pecados:\n\n1. Soberba × Humildade\n2. Avareza × Generosidade\n3. Luxúria × Castidade\n4. Ira × Paciência\n5. Gula × Temperança\n6. Inveja × Caridade\n7. Preguiça × Diligência\n\nChamam-se "capitais" porque são cabeça (caput) de muitos outros pecados. O combate a eles é essencial na vida espiritual.'
      },
      {
        label: 'Obras de Misericórdia',
        description: 'Viver a fé na prática',
        content: 'OBRAS CORPORAIS:\n1. Dar de comer a quem tem fome\n2. Dar de beber a quem tem sede\n3. Vestir os nus\n4. Acolher os peregrinos\n5. Visitar os doentes\n6. Visitar os presos\n7. Enterrar os mortos\n\nOBRAS ESPIRITUAIS:\n1. Dar bons conselhos\n2. Ensinar os ignorantes\n3. Corrigir os que erram\n4. Consolar os aflitos\n5. Perdoar as injúrias\n6. Suportar com paciência as fraquezas do próximo\n7. Rezar a Deus pelos vivos e pelos mortos'
      },
    ],
  },
]
