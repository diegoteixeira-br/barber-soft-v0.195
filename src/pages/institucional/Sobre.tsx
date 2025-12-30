import { InstitutionalLayout } from '@/layouts/InstitutionalLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Eye, Heart, Users, Award, TrendingUp } from 'lucide-react';

const Sobre = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'Organization',
      name: 'BarberSoft',
      description: 'Sistema de gestão para barbearias com inteligência artificial',
      foundingDate: '2025',
      founders: [{ '@type': 'Person', name: 'Equipe BarberSoft' }]
    }
  };

  return (
    <InstitutionalLayout breadcrumbs={[{ label: 'Sobre Nós' }]}>
      <SEOHead
        title="Sobre Nós"
        description="Conheça a história do BarberSoft, nossa missão de transformar a gestão de barbearias com tecnologia e inteligência artificial."
        canonical="/sobre"
        schema={schema}
      />

      <article>
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Sobre o BarberSoft</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transformando a gestão de barbearias com tecnologia de ponta e inteligência artificial.
          </p>
        </header>

        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Nossa História</h2>
              <p className="text-muted-foreground mb-4">
                O BarberSoft nasceu da necessidade real de modernizar a gestão de barbearias no Brasil. 
                Fundado em 2025, nosso objetivo sempre foi claro: criar uma solução completa que 
                automatize processos e libere tempo para o que realmente importa – atender bem os clientes.
              </p>
              <p className="text-muted-foreground">
                Hoje, somos referência em tecnologia para barbearias, ajudando milhares de 
                profissionais a aumentar seu faturamento e organizar seu negócio.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-primary mb-2">1000+</div>
              <p className="text-muted-foreground">Barbearias utilizam o BarberSoft</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Missão, Visão e Valores</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-8">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Missão</h3>
                <p className="text-muted-foreground">
                  Empoderar donos de barbearias com tecnologia acessível que automatiza a gestão 
                  e potencializa resultados.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <Eye className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Visão</h3>
                <p className="text-muted-foreground">
                  Ser a plataforma número 1 de gestão para barbearias na América Latina até 2027.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Valores</h3>
                <p className="text-muted-foreground">
                  Inovação, simplicidade, foco no cliente, transparência e compromisso com resultados.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Por que escolher o BarberSoft?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <Users className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Suporte Humanizado</h3>
                <p className="text-muted-foreground text-sm">
                  Equipe dedicada pronta para ajudar você a qualquer momento via WhatsApp.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Award className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Tecnologia de Ponta</h3>
                <p className="text-muted-foreground text-sm">
                  IA integrada que automatiza agendamentos e marketing.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <TrendingUp className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Resultados Comprovados</h3>
                <p className="text-muted-foreground text-sm">
                  Clientes relatam aumento médio de 40% no faturamento.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted p-8 rounded-xl text-center mb-16">
          <h2 className="text-2xl font-bold mb-4">Faça parte dessa transformação</h2>
          <p className="text-muted-foreground mb-2">
            Junte-se a milhares de barbearias que já utilizam o BarberSoft.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Quem Somos</h2>
          <Card>
            <CardContent className="pt-8">
              <p className="text-muted-foreground mb-4">
                O BarberSoft é desenvolvido pela <strong>DT Soluções Digital</strong>, uma empresa focada 
                em criar soluções tecnológicas inovadoras para automatização de processos empresariais.
              </p>
              <p className="text-muted-foreground mb-6">
                Nossa plataforma foi construída utilizando tecnologia <strong>Lovable</strong>, garantindo 
                uma experiência moderna, rápida e confiável para nossos usuários.
              </p>
              <div className="bg-background p-6 rounded-lg border">
                <h3 className="font-semibold mb-4">Informações da Empresa</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Razão Social:</strong> DT Soluções Digital - MEI</p>
                    <p><strong>CNPJ:</strong> 63.266.334/0001-21</p>
                  </div>
                  <div>
                    <p><strong>Endereço:</strong> Rua F. V de Azevedo, 07</p>
                    <p>Bairro Cohab Nova - Cáceres/MT</p>
                  </div>
                  <div>
                    <p><strong>E-mail:</strong> contato@dtsolucoesdigital.com.br</p>
                    <p><strong>WhatsApp:</strong> (65) 99302-5105</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </article>
    </InstitutionalLayout>
  );
};

export default Sobre;
