import numpy as np


def calculate_sgm(data_points, sh=10):
    data_points = np.maximum(1, data_points + sh)
    sgm = np.exp(np.mean(np.log(data_points))) - sh
    return sgm
