Founderexport default function Founder() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 via-slate-900 to-black text-white py-20">
        <div className="container mx-auto px-6 text-center">

          <img
            src="/images/founder.jpg"
            alt="Venkatesan Ponniah"
            className="w-44 h-44 mx-auto rounded-full border-4 border-yellow-400 shadow-2xl object-cover"
          />

          <h1 className="text-5xl font-bold mt-8">
            Venkatesan Ponniah
          </h1>

          <p className="text-2xl text-yellow-400 mt-2">
            Founder & CEO
          </p>

          <p className="text-xl mt-2">
            VATTAMS HOME SERVICES
          </p>

          <p className="text-lg mt-6 italic">
            From Vision to Reality
          </p>

        </div>
      </section>

      {/* My Story */}
      <section className="container mx-auto px-6 py-16">

        <h2 className="text-4xl font-bold mb-8 text-center">
          My Journey
        </h2>

        <div className="max-w-4xl mx-auto text-lg leading-9 text-gray-700 dark:text-gray-300">

          <p>
            My name is <strong>Venkatesan Ponniah</strong>, Founder &
            CEO of VATTAMS HOME SERVICES.
          </p>

          <br />

          <p>
            VATTAMS was not built by a large software company.
            It was built with determination, continuous learning,
            Artificial Intelligence and a single mobile phone.
          </p>

          <br />

          <p>
            I spent nearly three months learning, building,
            testing and improving every single feature of the
            platform.
          </p>

          <br />

          <p>
            Every page, every dashboard, every booking flow,
            customer portal, technician portal and admin panel
            was created step by step with patience and dedication.
          </p>

          <br />

          <p>
            Today, VATTAMS HOME SERVICES stands as proof that
            vision, persistence and technology can transform
            an idea into reality.
          </p>

        </div>

      </section>

      {/* Mission */}
      <section className="bg-slate-100 dark:bg-slate-900 py-16">

        <div className="container mx-auto px-6">

          <h2 className="text-4xl font-bold text-center mb-10">
            Mission
          </h2>

          <p className="max-w-4xl mx-auto text-center text-lg">
            To make trusted, transparent and technology-driven
            home services available for every household across India.
          </p>

        </div>

      </section>

      {/* Vision */}
      <section className="py-16">

        <div className="container mx-auto px-6">

          <h2 className="text-4xl font-bold text-center mb-10">
            Vision
          </h2>

          <p className="max-w-4xl mx-auto text-center text-lg">
            To build India's most trusted AI-powered home
            services platform.
          </p>

        </div>

      </section>

      {/* Leadership */}
      <section className="bg-slate-100 dark:bg-slate-900 py-16">

        <div className="container mx-auto px-6">

          <h2 className="text-4xl font-bold text-center mb-10">
            Leadership Principles
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="p-6 rounded-xl shadow bg-white">
              Customer First
            </div>

            <div className="p-6 rounded-xl shadow bg-white">
              Innovation
            </div>

            <div className="p-6 rounded-xl shadow bg-white">
              Transparency
            </div>

            <div className="p-6 rounded-xl shadow bg-white">
              Quality
            </div>

            <div className="p-6 rounded-xl shadow bg-white">
              Technology Driven
            </div>

            <div className="p-6 rounded-xl shadow bg-white">
              Continuous Learning
            </div>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="bg-blue-900 text-white py-20">

        <div className="container mx-auto px-6 text-center">

          <h2 className="text-4xl font-bold">
            Together Let's Build The Future
          </h2>

          <p className="mt-6 text-xl">
            Welcome to VATTAMS HOME SERVICES
          </p>

        </div>

      </section>

    </div>
  );
}