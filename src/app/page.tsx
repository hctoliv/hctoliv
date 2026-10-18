"use client";

import { useState } from "react";
import Image from "next/image";

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image src="/logo.svg" alt="Inova Labor" width={160} height={40} priority />
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = ["Início", "Sobre", "Serviços", "Depoimentos", "Contato"];

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#">
            <Logo />
          </a>
          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`}
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
          <a
            href="#contato"
            className="hidden md:inline-flex px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Fale Conosco
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3 border-t border-gray-100 pt-3">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
            <a href="#contato" className="mt-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg text-center">
              Fale Conosco
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-light via-white to-white">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light text-primary text-sm font-medium rounded-full mb-6">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            Soluções empresariais inteligentes
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary leading-tight">
            Impulsione o crescimento{" "}
            <span className="text-primary">do seu negócio</span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto lg:mx-0">
            A Inova Labor oferece soluções completas em tecnologia, gestão e
            estratégia para transformar a presença digital da sua empresa.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="#contato"
              className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-center"
            >
              Solicitar Proposta
            </a>
            <a
              href="#servicos"
              className="px-8 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors text-center"
            >
              Nossos Serviços
            </a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="relative">
            <div className="w-72 h-72 sm:w-80 sm:h-80 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
              <Image src="/logo.svg" alt="Inova Labor" width={200} height={60} className="brightness-0 invert scale-150" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent rounded-2xl flex items-center justify-center shadow-lg -rotate-6">
              <span className="text-white font-bold text-2xl">10+</span>
            </div>
            <p className="absolute -bottom-10 -right-4 text-xs text-muted font-medium">anos de exp.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const stats = [
    { value: "10+", label: "Anos de experiência" },
    { value: "500+", label: "Projetos entregues" },
    { value: "200+", label: "Clientes satisfeitos" },
    { value: "99%", label: "Taxa de satisfação" },
  ];

  return (
    <section id="sobre" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary">
              Sobre a <span className="text-primary">Inova Labor</span>
            </h2>
            <p className="mt-4 text-lg text-muted">
              Somos uma empresa especializada em soluções empresariais, unindo
              tecnologia, inovação e capital humano para transformar negócios.
            </p>
            <p className="mt-4 text-muted">
              Nossa missão é conectar empresas às melhores práticas do mercado,
              entregando resultados mensuráveis com agilidade e qualidade.
            </p>
            <a href="#contato" className="mt-8 inline-flex px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
              Conheça nossa história
            </a>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-gray-50 p-6 rounded-2xl text-center">
                <p className="text-4xl font-bold text-primary">{stat.value}</p>
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const services = [
    {
      title: "Desenvolvimento Web",
      description: "Sites e aplicações web modernas, responsivas e otimizadas para alta performance.",
      icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    },
    {
      title: "Consultoria em RH",
      description: "Gestão de pessoas, recrutamento e estratégias de desenvolvimento de equipes.",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      title: "Marketing Digital",
      description: "Estratégias que aumentam sua visibilidade online e geram leads qualificados.",
      icon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z",
    },
    {
      title: "Gestão Empresarial",
      description: "Processos otimizados, métricas claras e tomada de decisão baseada em dados.",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
  ];

  return (
    <section id="servicos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary">Nossos Serviços</h2>
          <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
            Soluções completas para transformar a presença digital e operacional da sua empresa.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div key={service.title} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 group">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <svg className="w-6 h-6 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={service.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-secondary">{service.title}</h3>
              <p className="mt-2 text-sm text-muted">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      name: "Ana Silva",
      role: "CEO, TechStart",
      text: "A Inova Labor superou todas as nossas expectativas. Os resultados foram além do que imaginávamos.",
    },
    {
      name: "Carlos Santos",
      role: "Diretor, Inova Corp",
      text: "Profissionalismo e qualidade em cada detalhe. Recomendo para qualquer empresa que busca crescimento.",
    },
    {
      name: "Maria Oliveira",
      role: "Fundadora, MO Design",
      text: "Parceria excepcional do início ao fim. Entenderam perfeitamente a nossa visão.",
    },
  ];

  return (
    <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary">O que Dizem Nossos Clientes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-muted italic">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{t.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-secondary text-sm">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Logo className="justify-center mb-6 brightness-0 invert" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Vamos conversar?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Entre em contato e descubra como a Inova Labor pode impulsionar seu negócio.
          </p>
        </div>
        <form className="grid sm:grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Seu nome" className="px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-primary" />
          <input type="email" placeholder="Seu e-mail" className="px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-primary" />
          <input type="tel" placeholder="Telefone / WhatsApp" className="px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-primary" />
          <input type="text" placeholder="Empresa" className="px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-primary" />
          <textarea placeholder="Como podemos ajudar?" rows={4} className="sm:col-span-2 px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-primary resize-none" />
          <button type="submit" className="sm:col-span-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            Enviar Mensagem
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Ou envie um e-mail para{" "}
          <a href="mailto:comercial@inovelabor.com.br" className="text-primary-light hover:underline">
            comercial@inovelabor.com.br
          </a>
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-secondary border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <Logo className="brightness-0 invert" />
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Inova Labor. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
