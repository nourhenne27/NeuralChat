
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';


export interface RagResponse {
  answer:          string;
  sources:         SourceRef[];
  confidenceScore: number;
  sessionId:       string;
}

export interface SourceRef {
  documentId:    string;
  documentTitle: string;
  excerpt:       string;
  score:         number;
}

export interface MockDocument {
  id:       string;
  name:     string;
  ext:      string;
  size:     string;
  date:     string;
  status:   'Indexed' | 'Pending' | 'Error';
  chunks:   number;
}

export interface MockUser {
  id:    string;
  name:  string;
  email: string;
  role:  'Admin' | 'Manager' | 'User';
  color: string;
}

export interface ActivityItem {
  icon:  string;
  color: string;
  text:  string;
  time:  string;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {

 
  private ragResponses: RagResponse[] = [
    {
      answer: `**L'architecture RAG (Retrieval-Augmented Generation)** est un paradigme qui enrichit les modèles de langage avec une base de connaissances externe.\n\n**Pipeline en 5 étapes :**\n1. **Embedding** — La question est convertie en vecteur numérique\n2. **Retrieval** — Recherche des passages similaires dans la vector DB\n3. **Context Building** — Construction du prompt avec les documents récupérés\n4. **Generation** — Le LLM génère une réponse contextualisée\n5. **Post-processing** — Nettoyage et formatage de la réponse`,
      sources: [
        { documentId: 'd1', documentTitle: 'Architecture_RAG.pdf', excerpt: 'Le pipeline RAG permet de connecter un LLM à une base de données vectorielle...', score: 0.97 },
        { documentId: 'd2', documentTitle: 'Guide_Embeddings.pdf', excerpt: 'Les embeddings transforment le texte en vecteurs denses dans un espace sémantique...', score: 0.83 }
      ],
      confidenceScore: 0.94,
      sessionId: 'session-' + Date.now()
    },
    {
      answer: `**L'embedding de texte** est la transformation d'un texte en vecteur numérique dense.\n\n**Comment ça fonctionne :**\n- Un modèle Transformer encode le texte\n- Résultat : un vecteur de **1 536 dimensions** (OpenAI ada-002)\n- Textes sémantiquement similaires → vecteurs proches\n\n**Exemple :**\n\`"intelligence artificielle"\` → \`[0.023, -0.891, 0.412, ...]\``,
      sources: [
        { documentId: 'd2', documentTitle: 'Guide_Embeddings.pdf', excerpt: 'Les modèles d\'embedding produisent des vecteurs de 1536 dimensions...', score: 0.96 },
        { documentId: 'd1', documentTitle: 'Architecture_RAG.pdf', excerpt: 'L\'étape d\'embedding est fondamentale pour la recherche sémantique...', score: 0.78 }
      ],
      confidenceScore: 0.91,
      sessionId: 'session-' + Date.now()
    },
    {
      answer: `**La similarité cosinus** mesure l'angle entre deux vecteurs dans un espace multidimensionnel.\n\n**Formule :**\n\`cos(θ) = (A · B) / (‖A‖ × ‖B‖)\`\n\n**Scores :**\n- **1.0** — Identiques\n- **0.8-0.99** — Très similaires\n- **0.5-0.8** — Partiellement liés\n- **< 0.5** — Peu de relation`,
      sources: [
        { documentId: 'd1', documentTitle: 'Architecture_RAG.pdf', excerpt: 'La recherche par similarité cosinus permet d\'identifier les chunks les plus pertinents...', score: 0.95 }
      ],
      confidenceScore: 0.88,
      sessionId: 'session-' + Date.now()
    },
    {
      answer: `**Documents disponibles dans la base :**\n\n| Document | Chunks | Statut |\n|----------|--------|--------|\n| Architecture_RAG.pdf | 142 | ✓ Indexé |\n| Guide_Embeddings.pdf | 98 | ✓ Indexé |\n| LLM_Best_Practices.docx | 67 | ✓ Indexé |\n\n**Total :** 307 chunks vectorisés et prêts pour la recherche sémantique.`,
      sources: [],
      confidenceScore: 0.99,
      sessionId: 'session-' + Date.now()
    }
  ];

  private ragIndex = 0;


  documents: MockDocument[] = [
    { id: 'd1', name: 'Architecture_RAG.pdf',       ext: 'PDF',  size: '2.4 MB', date: '15 avr. 2025', status: 'Indexed', chunks: 142 },
    { id: 'd2', name: 'Guide_Embeddings.pdf',        ext: 'PDF',  size: '1.8 MB', date: '12 avr. 2025', status: 'Indexed', chunks: 98  },
    { id: 'd3', name: 'LLM_Best_Practices.docx',    ext: 'DOCX', size: '856 KB', date: '8 avr. 2025',  status: 'Indexed', chunks: 67  },
  ];


  users: MockUser[] = [
    { id: 'u1', name: 'Admin User',    email: 'admin@neuralchat.ai',  role: 'Admin',   color: '#00d4ff' },
    { id: 'u2', name: 'Sarah Martin',  email: 'sarah@company.com',    role: 'Manager', color: '#ffb547' },
    { id: 'u3', name: 'Lucas Bernard', email: 'lucas@company.com',    role: 'User',    color: '#7c6aff' },
    { id: 'u4', name: 'Emma Dupont',   email: 'emma@company.com',     role: 'User',    color: '#00e5a0' },
    { id: 'u5', name: 'Thomas Roy',    email: 'thomas@company.com',   role: 'Manager', color: '#ff5e7a' },
  ];

 
  activities: ActivityItem[] = [
    { icon: '📄', color: '#00d4ff', text: '<strong>Admin</strong> a uploadé Architecture_v2.pdf',    time: 'Il y a 5 min' },
    { icon: '💬', color: '#00e5a0', text: '<strong>Sarah</strong> a démarré une session de chat',    time: 'Il y a 12 min' },
    { icon: '🔒', color: '#7c6aff', text: '<strong>Lucas</strong> s\'est connecté',                  time: 'Il y a 34 min' },
    { icon: '📝', color: '#ffb547', text: '<strong>Emma</strong> a soumis un feedback positif',      time: 'Il y a 1h' },
    { icon: '⚙️', color: '#ff5e7a', text: 'Réindexation complète terminée',                          time: 'Il y a 2h' },
    { icon: '📄', color: '#00d4ff', text: '<strong>Thomas</strong> a uploadé Guide_API.pdf',         time: 'Il y a 3h' },
  ];

 

 
  sendMessage(question: string): Observable<RagResponse> {
    const response = { ...this.ragResponses[this.ragIndex % this.ragResponses.length] };
    response.sessionId = 'session-' + Date.now();
    this.ragIndex++;
    const delayMs = 1200 + Math.random() * 800;
    return of(response).pipe(delay(delayMs));
  }

  getDocuments(): Observable<MockDocument[]> {
    return of([...this.documents]).pipe(delay(300));
  }

  deleteDocument(id: string): Observable<void> {
    this.documents = this.documents.filter(d => d.id !== id);
    return of(void 0).pipe(delay(200));
  }

  addDocument(doc: MockDocument): void {
    this.documents.push(doc);
  }

  getUsers(): Observable<MockUser[]> {
    return of([...this.users]).pipe(delay(200));
  }

  updateUserRole(userId: string, role: 'Admin' | 'Manager' | 'User'): Observable<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) user.role = role;
    return of(void 0).pipe(delay(100));
  }
}