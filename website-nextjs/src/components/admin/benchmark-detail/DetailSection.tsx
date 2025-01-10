const DetailSection = () => {
  const detailData = [
    {
      label: "Pypsa eur-sec-2-24h",
      description:
        "PyPSA Eur power sector infrastructure run for Italy considering 2050 as single plan....",
      footer: {
        left: "VERSION",
        right: "0.13.0 (commit 8f1a6b1)",
      },
    },
    {
      label: "PyPSA-eur-elec-trex-3-24h",
      description:
        "PyPSA Eur power sector infrastructure run for Italy considering 2050 as single plan....",
      footer: {
        left: "VERSION",
        right: "0.13.0 (commit 8f1a6b1)",
      },
    },
    {
      label: "PyPSA-eur-elec-op-3-24h",
      description:
        "PyPSA Eur power sector infrastructure run for Italy considering 2050 as single plan....",
      footer: {
        left: "VERSION",
        right: "0.13.0 (commit 8f1a6b1)",
      },
    },
    {
      label: "PyPSA eur-elec-op-unconv-3-24h",
      description:
        "PyPSA Eur power sector infrastructure run for Italy considering 2050 as single plan....",
      footer: {
        left: "VERSION",
        right: "0.13.0 (commit 8f1a6b1)",
      },
    },
    {
      label: "PyPSA eur-gas+sol+ely- 1- 1h",
      description:
        "PyPSA Eur power sector infrastructure run for Italy considering 2050 as single plan....",
      footer: {
        left: "VERSION",
        right: "0.13.1",
      },
    },
    {
      label: "PyPSA eur-gas+sol+ely-ucgas 1- 1h",
      description:
        "PyPSA Eur power sector infrastructure run for Italy considering 2050 as single plan....",
      footer: {
        left: "VERSION",
        right: "0.30.1",
      },
    },
  ]

  return (
    <div className="py-5">
      <ul className="grid grid-cols-3 justify-between text-dark-grey gap-y-2.5 gap-x-3">
        {detailData.map((data, idx) => (
          <li
            key={idx}
            className="flex flex-col justify-between p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100
            b text-base"
          >
            <h5 className="font-lato text-navy font-bold">{data.label}</h5>
            <p className="text-navy font-lato font-base mb-6">{data.description}</p>
            <p className="flex justify-between items-center font-base font-league">
              <span className="text-xs">{data.footer.left}</span>
              <span className="">{data.footer.right}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
export default DetailSection
