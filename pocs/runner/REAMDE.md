Here is a list of pypsa networks


 - model-energy-default.nc, simple power system model retrieved from [model.energy](https://model.energy/) with default parameters
 - model-energy-products.nc, simple energy model with hydrogen production retrieved from [model.energy/products](https://model.energy/products)  
 - pypsa-eur-tutorial.nc, a small tutorial network of the European electricity system from the [PyPSA-Eur repository](https://github.com/PyPSA/PyPSA-Eur)


 To create lp files from the networks, run the following python code:
 ```python
import pypsa
from pathlib import Path
n = pypsa.Network("model-energy-electricity.nc")
n.optimize.create_model()
n.model.to_file(Path("model-energy-electricity.lp"))
 ```

to write out linopy netcdf files, run the following python code:
```python
n.model.to_netcdf("model-energy-default-linopy.nc")
```


to run the optimization, run the following command:
```python
n.optimize()
```

